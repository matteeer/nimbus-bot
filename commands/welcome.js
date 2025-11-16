// commands/welcome.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
      .setDescription('Mostra il pannello di configurazione del sistema welcome.'),
  );

function buildWelcomeEmbed(guild, welcome) {
  const w = welcome;

  const channelLabel = w.channelId
    ? (guild.channels.cache.get(w.channelId) || `#${w.channelId}`)
    : 'Nessun canale configurato';

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Welcome • Configurazione')
    .setDescription(
      [
        `**Stato:** \`${w.enabled ? 'Attivo' : 'Disattivato'}\``,
        `**Canale:** ${channelLabel}`,
        `**Ping utente:** \`${w.pingUser ? 'Sì' : 'No'}\``,
        '',
        '**Messaggio attuale:**',
        w.message
          ? `\`\`\`\n${w.message.slice(0, 300)}\n\`\`\``
          : '_Nessun messaggio personalizzato. Verrà usato il default._',
        '',
        'Variabili disponibili nel testo:',
        '`{user}` → menzione / nome utente',
        '`{server}` → nome del server',
      ].join('\n'),
    )
    .setFooter({ text: 'Nimbus • /welcome panel' })
    .setTimestamp();
}

function buildWelcomeRow() {
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
      .setStyle(ButtonStyle.Primary),
  );
}

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.',
      ephemeral: true,
    });
  }

  const guild = interaction.guild;
  const guildId = guild.id;

  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);

  if (!settings.welcome) {
    settings.welcome = {
      enabled: false,
      channelId: null,
      pingUser: true,
      message: null,
      embed: { enabled: false },
    };
  }

  const embed = buildWelcomeEmbed(guild, settings.welcome);
  const row = buildWelcomeRow();

  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}

// ===== Handler bottoni welcome =====
export async function handleWelcomeButton(interaction) {
  if (!interaction.inGuild()) return;

  const guild = interaction.guild;
  const guildId = guild.id;
  const id = interaction.customId;

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({
      content: '❌ Ti mancano i permessi per configurare il welcome (Serve Manage Server).',
      ephemeral: true,
    });
  }

  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);

  if (!settings.welcome) {
    settings.welcome = {
      enabled: false,
      channelId: null,
      pingUser: true,
      message: null,
      embed: { enabled: false },
    };
  }

  const w = settings.welcome;

  // Modale per il messaggio
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

  // Aggiorna stato
  if (id === 'NIMBUS_WEL_ENABLE') {
    w.enabled = true;
    if (!w.channelId) w.channelId = interaction.channelId;
  }

  if (id === 'NIMBUS_WEL_DISABLE') {
    w.enabled = false;
  }

  if (id === 'NIMBUS_WEL_TOGGLE_PING') {
    w.pingUser = !w.pingUser;
  }

  // Aggiorna il pannello (stesso embed, stessi bottoni)
  const newEmbed = buildWelcomeEmbed(guild, w);
  const row = buildWelcomeRow();

  // update = modifica il messaggio ephemerale originale
  return interaction.update({
    embeds: [newEmbed],
    components: [row],
  });
}

// ===== Handler modale welcome =====
export async function handleWelcomeModal(interaction) {
  if (!interaction.inGuild()) return;
  if (interaction.customId !== 'NIMBUS_WEL_MODAL_MSG') return;

  const guild = interaction.guild;
  const guildId = guild.id;

  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);

  if (!settings.welcome) {
    settings.welcome = {
      enabled: false,
      channelId: null,
      pingUser: true,
      message: null,
      embed: { enabled: false },
    };
  }

  const w = settings.welcome;
  const message = interaction.fields.getTextInputValue('welcome_message');

  w.message = message;

  const newEmbed = buildWelcomeEmbed(guild, w);
  const row = buildWelcomeRow();

  // qui usiamo update perché la modale "continua" l’interazione del pannello
  return interaction.update({
    embeds: [newEmbed],
    components: [row],
  });
}
