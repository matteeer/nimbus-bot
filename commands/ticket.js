// commands/ticket.js
import {
  SlashCommandBuilder, ChannelType, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder,
  TextInputBuilder, TextInputStyle
} from 'discord.js';
import { getGuildSettings, setGuildSettings } from '../utils/settings.js';
import { nEmbed } from '../utils/ui.js';
import { makeThreadTranscript } from '../utils/transcript.js';

const OPEN_ID='NIMBUS_TICKET_OPEN', CLOSE_ID='NIMBUS_TICKET_CLOSE';
const TRANSCR_ID='NIMBUS_TICKET_TRANSCRIPT', ADD_ID='NIMBUS_TICKET_ADD', REMOVE_ID='NIMBUS_TICKET_REMOVE';
const ADD_MODAL_ID='NIMBUS_TICKET_ADD_MODAL', REM_MODAL_ID='NIMBUS_TICKET_REM_MODAL';

async function ensureTicketsChannel(guild, presetId) {
  if (presetId) {
    const ch = guild.channels.cache.get(presetId) ?? await guild.channels.fetch(presetId).catch(()=>null);
    if (ch && ch.type===ChannelType.GuildText) return ch;
  }
  let base = guild.channels.cache.find(ch => ch.type===ChannelType.GuildText && ['tickets','supporto','assistenza'].includes(ch.name.toLowerCase()));
  if (base) return base;
  base = await guild.channels.create({ name:'tickets', type:ChannelType.GuildText, reason:'Canale base per ticket Nimbus' }).catch(()=>null);
  return base;
}
const controlsRow = () => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(CLOSE_ID).setLabel('Chiudi').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
  new ButtonBuilder().setCustomId(TRANSCR_ID).setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('🧾'),
  new ButtonBuilder().setCustomId(ADD_ID).setLabel('Aggiungi utente').setStyle(ButtonStyle.Primary).setEmoji('➕'),
  new ButtonBuilder().setCustomId(REMOVE_ID).setLabel('Rimuovi utente').setStyle(ButtonStyle.Secondary).setEmoji('➖'),
);

export const data = new SlashCommandBuilder()
  .setName('ticket').setDescription('Sistema ticket con pannello e bottoni')
  .addSubcommand(sc => sc.setName('panel').setDescription('Invia/aggiorna il pannello ticket nel canale tickets')
    .addChannelOption(o=>o.setName('channel').setDescription('Se vuoi, indica il canale').addChannelTypes(ChannelType.GuildText))
    .addStringOption(o=>o.setName('titolo').setDescription('Titolo pannello'))
    .addStringOption(o=>o.setName('descrizione').setDescription('Descrizione pannello')))
  .addSubcommand(sc => sc.setName('close').setDescription('Chiudi il ticket corrente (solo staff)'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

export async function execute(interaction){
  const sub = interaction.options.getSubcommand();

  if (sub==='panel') {
    await interaction.deferReply({ ephemeral:true });

    const optChannel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('titolo') || 'Assistenza & Ticket';
    const description = interaction.options.getString('descrizione') || 'Hai bisogno di aiuto?\n\nClicca **Apri Ticket**: creeremo un thread privato con lo staff.';

    const s = getGuildSettings(interaction.guild.id);
    const base = optChannel ?? await ensureTicketsChannel(interaction.guild, s.ticketsChannelId);
    if (!base) return interaction.editReply('❌ Non riesco a creare/trovare un canale per i ticket.');

    setGuildSettings(interaction.guild.id, { ticketsChannelId: base.id });

    const embed = nEmbed(interaction.client, { title, description });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(OPEN_ID).setLabel('Apri Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎟️')
    );
    await base.send({ embeds:[embed], components:[row] }).catch(()=>{});
    return interaction.editReply(`✅ Pannello inviato in ${base}.`);
  }

  if (sub==='close') {
    if (!interaction.channel?.isThread())
      return interaction.reply({ content:'❌ Questo comando si usa dentro il thread del ticket.', ephemeral:true });

    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageThreads) &&
        !interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers) &&
        !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild))
      return interaction.reply({ content:'❌ Solo staff può chiudere i ticket.', ephemeral:true });

    await interaction.deferReply({ ephemeral:true });
    const file = await makeThreadTranscript(interaction.channel);
    await interaction.channel.send({ embeds:[nEmbed(interaction.client,{ title:'Transcript', description:'🧾 Transcript generato e allegato qui sotto.' })], files:[file] }).catch(()=>{});
    try { await interaction.channel.setArchived(true); } catch {}
    return interaction.editReply('✅ Ticket chiuso e trascritto.');
  }
}

export async function handleTicketButton(interaction){
  const id = interaction.customId;

  if (id===OPEN_ID) {
    await interaction.deferReply({ ephemeral:true });
    const s = getGuildSettings(interaction.guild.id);
    const baseId = s.ticketsChannelId;
    const base = baseId ? (interaction.guild.channels.cache.get(baseId) ?? await interaction.guild.channels.fetch(baseId).catch(()=>null)) : null;
    if (!base || base.type!==ChannelType.GuildText)
      return interaction.editReply('❌ Canale tickets non configurato. Usa `/setup setchannel type:tickets` o `/ticket panel`.');

    const thread = await base.threads.create({
      name: `ticket-${interaction.user.username}`.slice(0, 90),
      autoArchiveDuration: 60,
      type: ChannelType.PrivateThread,
      reason: `Ticket aperto da ${interaction.user.tag}`,
    }).catch(()=>null);
    if (!thread) return interaction.editReply('❌ Errore nella creazione del ticket.');

    await thread.members.add(interaction.user.id).catch(()=>{});
    const embed = nEmbed(interaction.client, {
      title: 'Ticket aperto',
      description: `Utente: ${interaction.user}\n\nScrivi qui sotto il tuo problema.\nLo staff risponderà a breve.`,
    });
    await thread.send({ content:`👋 Ciao ${interaction.user}`, embeds:[embed], components:[controlsRow()] }).catch(()=>{});
    return interaction.editReply(`✅ Ticket creato: <#${thread.id}>`);
  }

  if (id===CLOSE_ID) {
    if (!interaction.channel?.isThread())
      return interaction.reply({ content:'❌ Usa questo bottone dentro il thread del ticket.', ephemeral:true });
    await interaction.deferReply({ ephemeral:true });
    const file = await makeThreadTranscript(interaction.channel);
    await interaction.channel.send({ embeds:[nEmbed(interaction.client,{ title:'Transcript', description:'🧾 Transcript generato e allegato qui sotto.' })], files:[file] }).catch(()=>{});
    try { await interaction.channel.setArchived(true); } catch {}
    return interaction.editReply('✅ Ticket chiuso e trascritto.');
  }

  if (id===TRANSCR_ID) {
    if (!interaction.channel?.isThread())
      return interaction.reply({ content:'❌ Usa questo bottone dentro il thread del ticket.', ephemeral:true });
    await interaction.deferReply({ ephemeral:true });
    const file = await makeThreadTranscript(interaction.channel);
    await interaction.channel.send({ embeds:[nEmbed(interaction.client,{ title:'Transcript', description:'🧾 Transcript generato.' })], files:[file] }).catch(()=>{});
    return interaction.editReply('✅ Transcript inviato.');
  }

  if (id===ADD_ID || id===REMOVE_ID) {
    if (!interaction.channel?.isThread())
      return interaction.reply({ content:'❌ Usa questo bottone dentro il thread del ticket.', ephemeral:true });
    const modal = new ModalBuilder().setCustomId(id===ADD_ID? 'NIMBUS_TICKET_ADD_MODAL':'NIMBUS_TICKET_REM_MODAL')
      .setTitle(id===ADD_ID? 'Aggiungi utente al ticket':'Rimuovi utente dal ticket');
    const input = new TextInputBuilder().setCustomId('user_id').setLabel('ID o menzione utente').setStyle(TextInputStyle.Short).setPlaceholder('1234567890 oppure @utente').setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }
}

export async function handleTicketModal(interaction){
  const id = interaction.customId;
  const val = interaction.fields.getTextInputValue('user_id')?.trim();
  if (!interaction.channel?.isThread())
    return interaction.reply({ content:'❌ Usa questo dentro il thread del ticket.', ephemeral:true });

  const match = val.match(/\d{15,20}/);
  const userId = match ? match[0] : null;
  if (!userId) return interaction.reply({ content:'❌ Inserisci un ID valido o menziona un utente.', ephemeral:true });

  await interaction.deferReply({ ephemeral:true });

  if (id==='NIMBUS_TICKET_ADD_MODAL') {
    try { await interaction.channel.members.add(userId); return interaction.editReply('✅ Utente aggiunto al ticket.'); }
    catch { return interaction.editReply('❌ Non sono riuscito ad aggiungerlo (ID errato o permessi).'); }
  }
  if (id==='NIMBUS_TICKET_REM_MODAL') {
    try { await interaction.channel.members.remove(userId); return interaction.editReply('✅ Utente rimosso dal ticket.'); }
    catch { return interaction.editReply('❌ Non sono riuscito a rimuoverlo (ID errato o permessi).'); }
  }
}
