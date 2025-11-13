// commands/welcome.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';

import { ensureGuild, getGuildSettings, setGuildSettings } from '../utils/settings.js';
import { nEmbed } from '../utils/ui.js';

/* ================== IDS ================== */
const IDS = {
  // bottoni
  TOGGLE_ENABLED: 'NIMBUS_WEL_TOGGLE_ENABLED',
  TOGGLE_PING: 'NIMBUS_WEL_TOGGLE_PING',
  TOGGLE_EMBED: 'NIMBUS_WEL_TOGGLE_EMBED',
  SET_CHANNEL: 'NIMBUS_WEL_SET_CHANNEL',
  EDIT_TEXT: 'NIMBUS_WEL_EDIT_TEXT',
  EDIT_EMBED: 'NIMBUS_WEL_EDIT_EMBED',
  SET_THUMB: 'NIMBUS_WEL_SET_THUMB',
  SET_IMAGE: 'NIMBUS_WEL_SET_IMAGE',
  SET_FOOTER: 'NIMBUS_WEL_SET_FOOTER',
  SET_AUTOROLE: 'NIMBUS_WEL_SET_AUTOROLE',
  CLEAR_AUTOROLE: 'NIMBUS_WEL_CLEAR_AUTOROLE',
  PREVIEW: 'NIMBUS_WEL_PREVIEW',

  // modali
  MODAL_TEXT: 'NIMBUS_WEL_MODAL_TEXT',
  MODAL_EMBED: 'NIMBUS_WEL_MODAL_EMBED',
  MODAL_IMAGE: 'NIMBUS_WEL_MODAL_IMAGE',
  MODAL_FOOTER: 'NIMBUS_WEL_MODAL_FOOTER',
  MODAL_THUMBURL: 'NIMBUS_WEL_MODAL_THUMBURL',

  // select
  SELECT_CHANNEL: 'NIMBUS_WEL_SELECT_CHANNEL',
  SELECT_THUMB: 'NIMBUS_WEL_SELECT_THUMB',
  SELECT_AUTOROLE: 'NIMBUS_WEL_SELECT_AUTOROLE',
};

/* ============== SLASH CMD ============== */
export const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Apri il pannello di configurazione del benvenuto.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  ensureGuild(interaction.guildId);
  return interaction.reply({ ...buildPanel(interaction.client, interaction.guildId), flags: MessageFlags.Ephemeral });
}

/* ============== HELPERS ============== */
function buildPanel(client, guildId) {
  const s = getGuildSettings(guildId);
  const w = s.welcome ?? {};

  const status = w.enabled ? '🟢 Attivo' : '🔴 Disattivo';
  const channelTxt = w.channelId ? `<#${w.channelId}>` : '– nessuno –';
  const mode = w.embed?.enabled ? 'Embed' : 'Testo semplice';
  const ping = (w.pingUser ?? true) ? 'ON' : 'OFF';
  const autorole = w.autoroleId ? `<@&${w.autoroleId}>` : '– nessuno –';

  const embed = nEmbed(client, {
    title: '☁️ Welcome — Pannello di configurazione',
    description: [
      `**Stato:** ${status}`,
      `**Canale:** ${channelTxt}`,
      `**Formato:** ${mode}`,
      `**Ping utente:** ${ping}`,
      `**Auto-role:** ${autorole}`,
      '',
      'Usa `{user}` e `{server}` in titolo/descrizione/testo.',
    ].join('\n'),
  });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(IDS.TOGGLE_ENABLED).setLabel(w.enabled ? 'Disattiva' : 'Attiva').setStyle(w.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder().setCustomId(IDS.SET_CHANNEL).setLabel('Imposta canale').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(IDS.TOGGLE_EMBED).setLabel(w.embed?.enabled ? 'Usa testo' : 'Usa embed').setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(IDS.EDIT_TEXT).setLabel('Testo semplice').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(IDS.EDIT_EMBED).setLabel('Contenuto embed').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(IDS.TOGGLE_PING).setLabel((w.pingUser ?? true) ? 'Ping: ON' : 'Ping: OFF').setStyle(ButtonStyle.Secondary),
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(IDS.SET_THUMB).setLabel('Thumbnail').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(IDS.SET_IMAGE).setLabel('Immagine').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(IDS.SET_FOOTER).setLabel('Footer').setStyle(ButtonStyle.Secondary),
  );

  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(IDS.SET_AUTOROLE).setLabel('Imposta auto-role').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(IDS.CLEAR_AUTOROLE).setLabel('Rimuovi auto-role').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(IDS.PREVIEW).setLabel('Preview').setStyle(ButtonStyle.Success),
  );

  return { embeds: [embed], components: [row1, row2, row3, row4] };
}

export function buildWelcomeMessage(client, guild, userLike) {
  const s = getGuildSettings(guild.id);
  const w = s.welcome ?? {};
  const pingUser = w.pingUser ?? true;

  const mention = pingUser
    ? (userLike.toString ? userLike.toString() : `<@${userLike.id}>`)
    : `**@${userLike.username}**`;
  const allowedMentions = pingUser ? { users: [userLike.id] } : { parse: [] };

  // testo semplice
  if (!w.embed?.enabled) {
    const text = (w.message || 'Benvenuto {user} in **{server}**! 🎉')
      .replaceAll('{user}', mention)
      .replaceAll('{server}', guild.name);
    return { embed: null, content: text, allowedMentions };
  }

  // embed
  const title = (w.embed.title || 'Benvenuto {user}!')
    .replaceAll('{user}', `**@${userLike.username}**`)
    .replaceAll('{server}', guild.name);

  const description = (w.embed.description || 'Sei entrato in **{server}** 🎉')
    .replaceAll('{user}', `**@${userLike.username}**`)
    .replaceAll('{server}', guild.name);

  const embed = nEmbed(client, { title, description, color: w.embed.color ?? undefined });

  let thumb = null;
  if (w.embed.thumbnail === 'user') thumb = userLike.displayAvatarURL?.({ size: 256 }) ?? null;
  else if (w.embed.thumbnail === 'server') thumb = guild.iconURL({ size: 256 });
  else if (w.embed.thumbnail === 'custom') thumb = w.embed.customThumbUrl || null;
  if (thumb) embed.setThumbnail(thumb);

  if (w.embed.imageUrl) embed.setImage(w.embed.imageUrl);
  if (w.embed.footer) embed.setFooter({ text: w.embed.footer });

  return { embed, content: pingUser ? mention : null, allowedMentions };
}

// reply helper per evitare InteractionAlreadyReplied
async function safeEphemeralReply(interaction, payload) {
  if (interaction.replied || interaction.deferred) {
    return interaction.editReply(payload).catch(() => {});
  }
  return interaction.reply({ ...payload, flags: MessageFlags.Ephemeral }).catch(() => {});
}

/* ============== HANDLERS ============== */
export async function handleWelcomeButton(interaction) {
  const id = interaction.customId;

  ensureGuild(interaction.guildId);
  const s = getGuildSettings(interaction.guildId);
  const w = s.welcome ?? {};

  /* ---- MODALI (NO defer prima!) ---- */
  if (id === IDS.EDIT_TEXT) {
    const modal = new ModalBuilder().setCustomId(IDS.MODAL_TEXT).setTitle('Testo di benvenuto');
    const field = new TextInputBuilder()
      .setCustomId('text')
      .setLabel('Testo (usa {user} e {server})')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setValue(w.message || 'Benvenuto {user} in **{server}**! 🎉');
    modal.addComponents(new ActionRowBuilder().addComponents(field));
    return interaction.showModal(modal);
  }

  if (id === IDS.EDIT_EMBED) {
    const modal = new ModalBuilder().setCustomId(IDS.MODAL_EMBED).setTitle('Contenuto embed');
    const title = new TextInputBuilder().setCustomId('title').setLabel('Titolo').setStyle(TextInputStyle.Short).setRequired(false).setValue(w.embed?.title || '');
    const desc  = new TextInputBuilder().setCustomId('description').setLabel('Descrizione').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(w.embed?.description || '');
    modal.addComponents(
      new ActionRowBuilder().addComponents(title),
      new ActionRowBuilder().addComponents(desc),
    );
    return interaction.showModal(modal);
  }

  if (id === IDS.SET_IMAGE) {
    const modal = new ModalBuilder().setCustomId(IDS.MODAL_IMAGE).setTitle('Immagine (URL)');
    const url = new TextInputBuilder().setCustomId('url').setLabel('URL immagine (opzionale)').setStyle(TextInputStyle.Short).setRequired(false).setValue(w.embed?.imageUrl || '');
    modal.addComponents(new ActionRowBuilder().addComponents(url));
    return interaction.showModal(modal);
  }

  if (id === IDS.SET_FOOTER) {
    const modal = new ModalBuilder().setCustomId(IDS.MODAL_FOOTER).setTitle('Footer (testo)');
    const f = new TextInputBuilder().setCustomId('footer').setLabel('Footer (opzionale)').setStyle(TextInputStyle.Short).setRequired(false).setValue(w.embed?.footer || '');
    modal.addComponents(new ActionRowBuilder().addComponents(f));
    return interaction.showModal(modal);
  }

  /* ---- SELECT/PANNELLO (reply/update) ---- */
  if (id === IDS.SET_CHANNEL) {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(IDS.SELECT_CHANNEL)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setPlaceholder('Seleziona il canale di benvenuto')
        .setMinValues(1).setMaxValues(1)
    );
    const embed = new EmbedBuilder().setColor(0x5865f2).setDescription('Seleziona il canale da usare per il benvenuto.');
    return safeEphemeralReply(interaction, { embeds: [embed], components: [row] });
  }

  if (id === IDS.SET_THUMB) {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(IDS.SELECT_THUMB)
        .setPlaceholder('Scegli la thumbnail')
        .addOptions(
          { label: 'Nessuna', value: 'none' },
          { label: 'Avatar utente', value: 'user' },
          { label: 'Icona server', value: 'server' },
          { label: 'URL personalizzato', value: 'custom' },
        )
    );
    const embed = new EmbedBuilder().setColor(0x5865f2).setDescription('Scegli la thumbnail per l’embed.');
    return safeEphemeralReply(interaction, { embeds: [embed], components: [row] });
  }

  if (id === IDS.SET_AUTOROLE) {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(IDS.SELECT_AUTOROLE)
        .setPlaceholder('Seleziona il ruolo da assegnare all’ingresso')
        .setMinValues(1).setMaxValues(1)
    );
    const embed = new EmbedBuilder().setColor(0x5865f2).setDescription('Seleziona il **ruolo** da assegnare automaticamente ai nuovi membri.');
    return safeEphemeralReply(interaction, { embeds: [embed], components: [row] });
  }

  if (id === IDS.PREVIEW) {
    const { embed, content, allowedMentions } = buildWelcomeMessage(interaction.client, interaction.guild, interaction.user);
    return safeEphemeralReply(interaction, { content, embeds: embed ? [embed] : [], components: [], allowedMentions });
  }

  if (id === IDS.TOGGLE_ENABLED) {
    const enabled = !w.enabled;
    setGuildSettings(interaction.guildId, { welcome: { ...w, enabled } });
    return safeEphemeralReply(interaction, buildPanel(interaction.client, interaction.guildId));
  }

  if (id === IDS.TOGGLE_PING) {
    const pingUser = !(w.pingUser ?? true);
    setGuildSettings(interaction.guildId, { welcome: { ...w, pingUser } });
    return safeEphemeralReply(interaction, buildPanel(interaction.client, interaction.guildId));
  }

  if (id === IDS.TOGGLE_EMBED) {
    const embed = { ...(w.embed ?? {}), enabled: !(w.embed?.enabled ?? false) };
    setGuildSettings(interaction.guildId, { welcome: { ...w, embed } });
    return safeEphemeralReply(interaction, buildPanel(interaction.client, interaction.guildId));
  }

  if (id === IDS.CLEAR_AUTOROLE) {
    setGuildSettings(interaction.guildId, { welcome: { ...w, autoroleId: null } });
    return safeEphemeralReply(interaction, buildPanel(interaction.client, interaction.guildId));
  }

  // fallback: ripropone il pannello
  return safeEphemeralReply(interaction, buildPanel(interaction.client, interaction.guildId));
}

export async function handleWelcomeSelect(interaction) {
  const id = interaction.customId;

  ensureGuild(interaction.guildId);
  const s = getGuildSettings(interaction.guildId);
  const w = s.welcome ?? {};

  if (id === IDS.SELECT_CHANNEL) {
    const chId = interaction.values?.[0];
    setGuildSettings(interaction.guildId, { welcome: { ...w, channelId: chId } });
    return interaction.update(buildPanel(interaction.client, interaction.guildId));
  }

  if (id === IDS.SELECT_THUMB) {
    const choice = interaction.values?.[0];
    let embed = { ...(w.embed ?? {}), thumbnail: choice === 'none' ? null : choice };
    if (choice !== 'custom') embed.customThumbUrl = null;
    setGuildSettings(interaction.guildId, { welcome: { ...w, embed } });

    if (choice === 'custom') {
      const modal = new ModalBuilder().setCustomId(IDS.MODAL_THUMBURL).setTitle('URL thumbnail personalizzata');
      const ti = new TextInputBuilder().setCustomId('url').setLabel('URL immagine').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(ti));
      return interaction.showModal(modal);
    }
    return interaction.update(buildPanel(interaction.client, interaction.guildId));
  }

  if (id === IDS.SELECT_AUTOROLE) {
    const roleId = interaction.values?.[0];
    setGuildSettings(interaction.guildId, { welcome: { ...w, autoroleId: roleId } });
    return interaction.update(buildPanel(interaction.client, interaction.guildId));
  }

  return interaction.reply({ content: '❌ Select non riconosciuta.', flags: MessageFlags.Ephemeral });
}

export async function handleWelcomeModal(interaction) {
  const id = interaction.customId;

  ensureGuild(interaction.guildId);
  const s = getGuildSettings(interaction.guildId);
  const w = s.welcome ?? {};

  if (id === IDS.MODAL_TEXT) {
    const text = interaction.fields.getTextInputValue('text')?.trim();
    setGuildSettings(interaction.guildId, { welcome: { ...w, message: text } });
    return interaction.reply({ ...buildPanel(interaction.client, interaction.guildId), flags: MessageFlags.Ephemeral });
  }

  if (id === IDS.MODAL_EMBED) {
    const title = interaction.fields.getTextInputValue('title')?.trim() || null;
    const description = interaction.fields.getTextInputValue('description')?.trim() || null;
    const embed = { ...(w.embed ?? {}), enabled: true, title, description };
    setGuildSettings(interaction.guildId, { welcome: { ...w, embed } });
    return interaction.reply({ ...buildPanel(interaction.client, interaction.guildId), flags: MessageFlags.Ephemeral });
  }

  if (id === IDS.MODAL_IMAGE) {
    const url = interaction.fields.getTextInputValue('url')?.trim() || null;
    const embed = { ...(w.embed ?? {}), imageUrl: url || null, enabled: true };
    setGuildSettings(interaction.guildId, { welcome: { ...w, embed } });
    return interaction.reply({ ...buildPanel(interaction.client, interaction.guildId), flags: MessageFlags.Ephemeral });
  }

  if (id === IDS.MODAL_FOOTER) {
    const footer = interaction.fields.getTextInputValue('footer')?.trim() || null;
    const embed = { ...(w.embed ?? {}), footer, enabled: true };
    setGuildSettings(interaction.guildId, { welcome: { ...w, embed } });
    return interaction.reply({ ...buildPanel(interaction.client, interaction.guildId), flags: MessageFlags.Ephemeral });
  }

  return interaction.reply({ content: '❌ Modale non riconosciuta.', flags: MessageFlags.Ephemeral });
}

export async function handleWelcomeThumbUrlModal(interaction) {
  const url = interaction.fields.getTextInputValue('url')?.trim();
  ensureGuild(interaction.guildId);
  const s = getGuildSettings(interaction.guildId);
  const w = s.welcome ?? {};
  const embed = { ...(w.embed ?? {}), thumbnail: 'custom', customThumbUrl: url || null, enabled: true };
  setGuildSettings(interaction.guildId, { welcome: { ...w, embed } });
  return interaction.reply({ ...buildPanel(interaction.client, interaction.guildId), flags: MessageFlags.Ephemeral });
}
