// commands/welcome.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import { ensureGuild, getGuildSettings, saveGuild } from '../utils/settings.js';

// =======================
//  Default config
// =======================
function getDefaultWelcome() {
  return {
    enabled: false,
    channelId: null,
    pingUser: true,
    autoroleId: null,
    mode: 'embed', // 'embed' | 'text'
    message: 'Benvenuto {user} in **{server}**! 🎉',
    embed: {
      enabled: true,
      title: 'Benvenuto {user}!',
      description: 'Sei entrato in **{server}** 🎉',
      color: 0x5865f2,
      thumbnail: 'user', // 'user' | 'server' | 'custom' | null
      customThumbUrl: null,
      imageUrl: null,
      footer: 'Benvenuto nel server!',
    },
  };
}

// =======================
//  Slash command /welcome
// =======================
export const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Configura i messaggi di benvenuto.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

// =======================
//  UI: pannello embed + bottoni
// =======================
function buildWelcomePanelEmbed(guild, settings) {
  const s = settings || {};
  const w = s.welcome ?? getDefaultWelcome();

  const channelText = w.channelId ? `<#${w.channelId}>` : 'Non impostato';
  const autoroleText = w.autoroleId ? `<@&${w.autoroleId}>` : 'Nessun ruolo automatico';

  const modeIsEmbed = w.embed?.enabled ?? (w.mode !== 'text');
  const modeText = modeIsEmbed ? 'Embed' : 'Messaggio semplice';
  const statusText = w.enabled ? 'Attivo' : 'Disattivo';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Welcome')
    .setDescription(
      [
        'Configura come Nimbus accoglie i nuovi utenti nel server.',
        '',
        `**Stato:** \`${statusText}\``,
        `**Canale:** ${channelText}`,
        `**Ruolo automatico:** ${autoroleText}`,
        `**Modalità:** \`${modeText}\``,
        '',
        '**Placeholder disponibili:**',
        '`{user}` → menzione o nome utente',
        '`{server}` → nome del server',
      ].join('\n'),
    )
    .setFooter({
      text: `Server: ${guild.name}`,
      iconURL: guild.iconURL({ size: 128 }) ?? undefined,
    })
    .setTimestamp();

  return embed;
}

function buildWelcomePanelRow(settings) {
  const s = settings || {};
  const w = s.welcome ?? getDefaultWelcome();

  const enabled = !!w.enabled;
  const modeIsEmbed = w.embed?.enabled ?? (w.mode !== 'text');

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('NIMBUS_WEL_TOGGLE')
      .setLabel(enabled ? 'Disabilita' : 'Abilita')
      .setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('NIMBUS_WEL_CH')
      .setLabel('Imposta canale')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('NIMBUS_WEL_TEXT')
      .setLabel('Configura testo')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('NIMBUS_WEL_AUTOROLE')
      .setLabel('Ruolo automatico')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('NIMBUS_WEL_MODE')
      .setLabel(modeIsEmbed ? 'Passa a messaggio' : 'Passa a embed')
      .setStyle(ButtonStyle.Secondary),
  );
}

// =======================
//  /welcome → mostra pannello
// =======================
export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.',
      ephemeral: true,
    });
  }

  const guildId = interaction.guild.id;
  ensureGuild(guildId);

  const settings = getGuildSettings(guildId);
  if (!settings.welcome) {
    settings.welcome = getDefaultWelcome();
    saveGuild(guildId, settings);
  }

  const embed = buildWelcomePanelEmbed(interaction.guild, settings);
  const row = buildWelcomePanelRow(settings);

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}

// =======================
//  Handler BOTTONI (WELCOME)
// =======================
export async function handleWelcomeButton(interaction) {
  if (!interaction.inGuild()) return;

  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.welcome) settings.welcome = getDefaultWelcome();
  const w = settings.welcome;
  const id = interaction.customId;

  // ON/OFF
  if (id === 'NIMBUS_WEL_TOGGLE') {
    w.enabled = !w.enabled;
    saveGuild(guildId, settings);

    const embed = buildWelcomePanelEmbed(interaction.guild, settings);
    const row = buildWelcomePanelRow(settings);
    return interaction.update({ embeds: [embed], components: [row] });
  }

  // Imposta canale = canale corrente
  if (id === 'NIMBUS_WEL_CH') {
    w.channelId = interaction.channel.id;
    saveGuild(guildId, settings);

    const embed = buildWelcomePanelEmbed(interaction.guild, settings);
    const row = buildWelcomePanelRow(settings);
    return interaction.update({ embeds: [embed], components: [row] });
  }

  // Cambia modalità embed / text
  if (id === 'NIMBUS_WEL_MODE') {
    const modeIsEmbed = w.embed?.enabled ?? (w.mode !== 'text');
    if (!w.embed) w.embed = getDefaultWelcome().embed;

    if (modeIsEmbed) {
      w.embed.enabled = false;
      w.mode = 'text';
    } else {
      w.embed.enabled = true;
      w.mode = 'embed';
    }

    saveGuild(guildId, settings);
    const embed = buildWelcomePanelEmbed(interaction.guild, settings);
    const row = buildWelcomePanelRow(settings);
    return interaction.update({ embeds: [embed], components: [row] });
  }

  // Config testo (apre modale)
  if (id === 'NIMBUS_WEL_TEXT') {
    const modeIsEmbed = w.embed?.enabled ?? (w.mode !== 'text');
    const defaults = getDefaultWelcome();

    const currentTitle = modeIsEmbed
      ? (w.embed?.title ?? defaults.embed.title)
      : 'Messaggio semplice';

    const currentBody = modeIsEmbed
      ? (w.embed?.description ?? defaults.embed.description)
      : (w.message ?? defaults.message);

    const modal = new ModalBuilder()
      .setCustomId('NIMBUS_WEL_MODAL_TEXT')
      .setTitle('Configura welcome');

    const titleInput = new TextInputBuilder()
      .setCustomId('wel_title')
      .setLabel(modeIsEmbed ? 'Titolo embed (opzionale)' : 'Titolo (solo descrittivo)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(currentTitle.slice(0, 100));

    const bodyInput = new TextInputBuilder()
      .setCustomId('wel_body')
      .setLabel('Testo di benvenuto (usa {user} e {server})')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setValue(currentBody.slice(0, 1900));

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(bodyInput),
    );

    return interaction.showModal(modal);
  }

  // Autorole (apre modale)
  if (id === 'NIMBUS_WEL_AUTOROLE') {
    const currentRoleText = w.autoroleId ? `<@&${w.autoroleId}>` : 'nessuno';

    const modal = new ModalBuilder()
      .setCustomId('NIMBUS_WEL_MODAL_AUTOROLE')
      .setTitle('Ruolo automatico');

    const roleInput = new TextInputBuilder()
      .setCustomId('wel_role')
      .setLabel('ID ruolo / @menzione / "none"')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(currentRoleText);

    modal.addComponents(
      new ActionRowBuilder().addComponents(roleInput),
    );

    return interaction.showModal(modal);
  }
}

// =======================
//  Handler MODALI (WELCOME)
// =======================
export async function handleWelcomeModal(interaction) {
  if (!interaction.inGuild()) return;

  const id = interaction.customId;
  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.welcome) settings.welcome = getDefaultWelcome();
  const w = settings.welcome;

  // Modale testo
  if (id === 'NIMBUS_WEL_MODAL_TEXT') {
    const modeIsEmbed = w.embed?.enabled ?? (w.mode !== 'text');
    const defaults = getDefaultWelcome();

    const title = interaction.fields.getTextInputValue('wel_title') || null;
    const body = interaction.fields.getTextInputValue('wel_body') || null;

    if (modeIsEmbed) {
      if (!w.embed) w.embed = defaults.embed;
      if (title) w.embed.title = title;
      if (body) w.embed.description = body;
      w.embed.enabled = true;
      w.mode = 'embed';
    } else {
      w.message = body || defaults.message;
      w.mode = 'text';
      if (w.embed) w.embed.enabled = false;
    }

    saveGuild(guildId, settings);

    if (interaction.message) {
      const panelEmbed = buildWelcomePanelEmbed(interaction.guild, settings);
      const row = buildWelcomePanelRow(settings);
      await interaction.message.edit({ embeds: [panelEmbed], components: [row] }).catch(() => {});
    }

    return interaction.reply({
      content: '✅ Messaggio di benvenuto aggiornato.',
      ephemeral: true,
    });
  }

  // Modale autorole
  if (id === 'NIMBUS_WEL_MODAL_AUTOROLE') {
    const raw = interaction.fields.getTextInputValue('wel_role').trim();

    if (!raw || raw.toLowerCase() === 'none' || raw.toLowerCase() === 'nessuno') {
      w.autoroleId = null;
      saveGuild(guildId, settings);

      if (interaction.message) {
        const panelEmbed = buildWelcomePanelEmbed(interaction.guild, settings);
        const row = buildWelcomePanelRow(settings);
        await interaction.message.edit({ embeds: [panelEmbed], components: [row] }).catch(() => {});
      }

      return interaction.reply({
        content: '✅ Ruolo automatico disattivato.',
        ephemeral: true,
      });
    }

    let roleId = null;
    const mentionMatch = raw.match(/^<@&(\d+)>$/);
    if (mentionMatch) roleId = mentionMatch[1];
    else if (/^\d+$/.test(raw)) roleId = raw;

    if (!roleId) {
      return interaction.reply({
        content: '❌ Valore non valido. Usa un ID ruolo, una menzione o "none".',
        ephemeral: true,
      });
    }

    const role =
      interaction.guild.roles.cache.get(roleId) ||
      (await interaction.guild.roles.fetch(roleId).catch(() => null));

    if (!role) {
      return interaction.reply({
        content: '❌ Ruolo non trovato. Controlla l’ID o la menzione.',
        ephemeral: true,
      });
    }

    w.autoroleId = role.id;
    saveGuild(guildId, settings);

    if (interaction.message) {
      const panelEmbed = buildWelcomePanelEmbed(interaction.guild, settings);
      const row = buildWelcomePanelRow(settings);
      await interaction.message.edit({ embeds: [panelEmbed], components: [row] }).catch(() => {});
    }

    return interaction.reply({
      content: `✅ Ruolo automatico impostato su ${role}.`,
      ephemeral: true,
    });
  }
}

// =======================
//  Export “dummy” per compatibilità
// =======================
export async function handleWelcomeSelect() {
  // non usato nella nuova versione
}

export async function handleWelcomeThumbUrlModal() {
  // non usato nella nuova versione
}
