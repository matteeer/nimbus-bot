import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from 'discord.js';

import { ensureGuild, getGuildSettings } from '../utils/settings.js';

export const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Configura i messaggi di benvenuto.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand(sub =>
    sub
      .setName('panel')
      .setDescription('Mostra il pannello di configurazione del sistema welcome.')
  );

function buildWelcomeEmbed(guild, welcome) {
  const channelLabel = welcome.channelId
    ? (guild.channels.cache.get(welcome.channelId)?.toString() || `#${welcome.channelId}`)
    : 'Nessun canale configurato';

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Welcome • Configurazione')
    .setDescription(
      [
        `**Stato:** \`${welcome.enabled ? 'Attivo' : 'Disattivato'}\``,
        `**Canale:** ${channelLabel}`,
        `**Ping utente:** \`${welcome.pingUser ? 'Sì' : 'No'}\``,
        '',
        '**Messaggio attuale:**',
        welcome.message
          ? `\`\`\`\n${welcome.message.slice(0, 300)}\n\`\`\``
          : '_Nessun messaggio personalizzato. Verrà usato il default._',
        '',
        'Variabili disponibili nel testo:',
        '`{user}` → menzione / nome utente',
        '`{server}` → nome del server',
      ].join('\n')
    )
    .setFooter({ text: 'Nimbus • /welcome panel' })
    .setTimestamp();
}

function buildWelcomeButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('NIMBUS_WEL_ENABLE')
      .setLabel('Attiva welcome')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('NIMBUS_WEL_DISABLE')
      .setLabel('Disattiva welcome')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('NIMBUS_WEL_TOGGLE_PING')
      .setLabel('Ping utente ON/OFF')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('NIMBUS_WEL_SETMSG')
      .setLabel('Modifica messaggio')
      .setStyle(ButtonStyle.Primary)
  );
}

function buildChannelSelectMenu(guild) {
  const channels = guild.channels.cache
    .filter(ch => ch.isTextBased())
    .map(ch => ({ label: ch.name, value: ch.id }));

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('NIMBUS_WEL_CHANNEL_SELECT')
      .setPlaceholder('Seleziona il canale welcome')
      .addOptions(channels)
  );
}

// ===== Slash command =====
export async function execute(interaction) {
  if (!interaction.inGuild()) return interaction.reply({ content: '❌ Solo in server.', ephemeral: true });

  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);

  if (!settings.welcome) settings.welcome = { enabled: false, channelId: null, pingUser: true, message: null, embed: { enabled: false } };

  const embed = buildWelcomeEmbed(interaction.guild, settings.welcome);
  const buttons = buildWelcomeButtons();
  const channelSelect = buildChannelSelectMenu(interaction.guild);

  await interaction.reply({ embeds: [embed], components: [buttons, channelSelect], ephemeral: true });
}

// ===== Bottoni =====
export async function handleWelcomeButton(interaction) {
  if (!interaction.inGuild()) return;
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Serve permesso Manage Server.', ephemeral: true });
  }

  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.welcome) settings.welcome = { enabled: false, channelId: null, pingUser: true, message: null, embed: { enabled: false } };
  const w = settings.welcome;

  const id = interaction.customId;

  if (id === 'NIMBUS_WEL_SETMSG') {
    const modal = new ModalBuilder()
      .setCustomId('NIMBUS_WEL_MODAL_MSG')
      .setTitle('Messaggio di benvenuto');

    const input = new TextInputBuilder()
      .setCustomId('welcome_message')
      .setLabel('Testo del messaggio')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('Es: Benvenuto {user} in {server}!');

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
    return interaction.showModal(modal);
  }

  if (id === 'NIMBUS_WEL_ENABLE') w.enabled = true;
  if (id === 'NIMBUS_WEL_DISABLE') w.enabled = false;
  if (id === 'NIMBUS_WEL_TOGGLE_PING') w.pingUser = !w.pingUser;

  const embed = buildWelcomeEmbed(interaction.guild, w);
  const buttons = buildWelcomeButtons();
  const channelSelect = buildChannelSelectMenu(interaction.guild);

  return interaction.update({ embeds: [embed], components: [buttons, channelSelect] });
}

// ===== Select Menu =====
export async function handleWelcomeSelect(interaction) {
  if (!interaction.inGuild()) return;
  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.welcome) settings.welcome = { enabled: false, channelId: null, pingUser: true, message: null, embed: { enabled: false } };
  const w = settings.welcome;

  if (interaction.customId === 'NIMBUS_WEL_CHANNEL_SELECT') {
    const selected = interaction.values[0];
    w.channelId = selected;

    const embed = buildWelcomeEmbed(interaction.guild, w);
    const buttons = buildWelcomeButtons();
    const channelSelect = buildChannelSelectMenu(interaction.guild);

    return interaction.update({ embeds: [embed], components: [buttons, channelSelect] });
  }
}

// ===== Modale =====
export async function handleWelcomeModal(interaction) {
  if (!interaction.inGuild() || interaction.customId !== 'NIMBUS_WEL_MODAL_MSG') return;
  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.welcome) settings.welcome = { enabled: false, channelId: null, pingUser: true, message: null, embed: { enabled: false } };
  const w = settings.welcome;

  const message = interaction.fields.getTextInputValue('welcome_message');
  w.message = message;

  const embed = buildWelcomeEmbed(interaction.guild, w);
  const buttons = buildWelcomeButtons();
  const channelSelect = buildChannelSelectMenu(interaction.guild);

  return interaction.update({ embeds: [embed], components: [buttons, channelSelect] });
}
