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

  const w = settings.welcome;

  const channelLabel = w.channelId
    ? (guild.channels.cache.get(w.channelId) || `#${w.channelId}`)
    : 'Nessun canale configurato';

  const embed = new EmbedBuilder()
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

  const row = new ActionRowBuilder().addComponents(
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

  // solo chi ha ManageGuild
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

  // Per gli altri bottoni rispondiamo ephemerale
  if (id === 'NIMBUS_WEL_ENABLE') {
    w.enabled = true;
    // se non c’è ancora un canale, imposta quello dove stai eseguendo il comando
    if (!w.channelId) {
      w.channelId = interaction.channelId;
    }

    return interaction.reply({
      content: `✅ Sistema welcome **attivato**. Canale corrente: <#${w.channelId}>`,
      ephemeral: true,
    });
  }

  if (id === 'NIMBUS_WEL_DISABLE') {
    w.enabled = false;
    return interaction.reply({
      content: '✅ Sistema welcome **disattivato**.',
      ephemeral: true,
    });
  }

  if (id === 'NIMBUS_WEL_TOGGLE_PING') {
    w.pingUser = !w.pingUser;
    return interaction.reply({
      content: `✅ Ping utente all’ingresso: \`${w.pingUser ? 'attivo' : 'disattivato'}\`.`,
      ephemeral: true,
    });
  }
}

// ===== Handler modale welcome =====
export async function handleWelcomeModal(interaction) {
  if (!interaction.inGuild()) return;
  if (interaction.customId !== 'NIMBUS_WEL_MODAL_MSG') return;

  const guildId = interaction.guild.id;

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

  return interaction.reply({
    content: '✅ Messaggio di benvenuto aggiornato.',
    ephemeral: true,
  });
}
