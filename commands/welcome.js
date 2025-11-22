import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
} from 'discord.js';

import { ensureGuild, getGuildSettings } from '../utils/settings.js';

export const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Configura i messaggi di benvenuto.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand(sub =>
    sub.setName('panel').setDescription('Mostra il pannello di configurazione del welcome.')
  );

function buildWelcomeEmbed(guild, w) {
  const channelLabel = w.channelId ? (guild.channels.cache.get(w.channelId) || `#${w.channelId}`) : 'Nessun canale configurato';
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Welcome • Configurazione')
    .setDescription([
      `**Stato:** \`${w.enabled ? 'Attivo' : 'Disattivato'}\``,
      `**Canale:** ${channelLabel}`,
      `**Ping utente:** \`${w.pingUser ? 'Sì' : 'No'}\``,
      `**Embed:** \`${w.embed?.enabled ? 'Attivo' : 'Disattivato'}\``,
      '',
      '**Messaggio attuale:**',
      w.message ? `\`\`\`\n${w.message.slice(0, 300)}\n\`\`\`` : '_Nessun messaggio personalizzato._',
      '',
      'Variabili disponibili: `{user}` = utente, `{server}` = server'
    ].join('\n'))
    .setFooter({ text: 'Nimbus • /welcome panel' })
    .setTimestamp();
}

function buildWelcomeRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('NIMBUS_WEL_ENABLE').setLabel('Attiva welcome').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('NIMBUS_WEL_DISABLE').setLabel('Disattiva welcome').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('NIMBUS_WEL_TOGGLE_PING').setLabel('Ping ON/OFF').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('NIMBUS_WEL_TOGGLE_EMBED').setLabel('Embed ON/OFF').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('NIMBUS_WEL_SETMSG').setLabel('Modifica messaggio').setStyle(ButtonStyle.Primary)
  );
}

export async function execute(interaction) {
  if (!interaction.inGuild()) return interaction.reply({ content: '❌ Solo in server.', ephemeral: true });
  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.welcome) settings.welcome = { enabled: false, channelId: null, pingUser: true, message: null, embed: { enabled: false } };
  return interaction.reply({ embeds: [buildWelcomeEmbed(interaction.guild, settings.welcome)], components: [buildWelcomeRow()], ephemeral: true });
}

export async function handleWelcomeButton(interaction) {
  if (!interaction.inGuild()) return;
  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.welcome) settings.welcome = { enabled: false, channelId: null, pingUser: true, message: null, embed: { enabled: false } };

  const w = settings.welcome;
  const id = interaction.customId;

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: '❌ Serve Manage Server.', ephemeral: true });

  if (id === 'NIMBUS_WEL_SETMSG') {
    const modal = new ModalBuilder().setCustomId('NIMBUS_WEL_MODAL_MSG').setTitle('Messaggio di benvenuto');
    const input = new TextInputBuilder().setCustomId('welcome_message').setLabel('Testo').setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder('Es: Benvenuto {user} in {server}!');
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }
  if (id === 'NIMBUS_WEL_ENABLE') w.enabled = true;
  if (id === 'NIMBUS_WEL_DISABLE') w.enabled = false;
  if (id === 'NIMBUS_WEL_TOGGLE_PING') w.pingUser = !w.pingUser;
  if (id === 'NIMBUS_WEL_TOGGLE_EMBED') w.embed.enabled = !w.embed.enabled;

  return interaction.update({ embeds: [buildWelcomeEmbed(interaction.guild, w)], components: [buildWelcomeRow()] });
}

export async function handleWelcomeModal(interaction) {
  if (!interaction.inGuild()) return;
  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.welcome) settings.welcome = { enabled: false, channelId: null, pingUser: true, message: null, embed: { enabled: false } };

  const w = settings.welcome;
  w.message = interaction.fields.getTextInputValue('welcome_message');

  return interaction.update({ embeds: [buildWelcomeEmbed(interaction.guild, w)], components: [buildWelcomeRow()] });
}
