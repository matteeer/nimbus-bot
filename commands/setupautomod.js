// commands/setupautomod.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord.js';

import { ensureGuild, getGuildSettings } from '../utils/settings.js';

export const data = new SlashCommandBuilder()
  .setName('setupautomod')
  .setDescription('Configura il sistema AutoMod di Nimbus.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

function buildAutomodEmbed(settings) {
  const automod = settings.automod ?? { enabled: false };
  const enabled = !!automod.enabled;

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('AutoMod')
    .setDescription(
      [
        'Configurazione del sistema AutoMod di Nimbus.',
        '',
        '**Cosa fa:**',
        '• Controllo spam / flood di base',
        '• Controllo mass mention',
        '• Blocca alcune parole vietate predefinite',
        '',
        `**Stato attuale:** \`${enabled ? 'Attivo' : 'Disattivato'}\``,
      ].join('\n'),
    )
    .setTimestamp();
}

function buildAutomodRow(settings) {
  const automod = settings.automod ?? { enabled: false };
  const enabled = !!automod.enabled;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('AUTOMOD_ENABLE')
      .setLabel(enabled ? 'Già attivo' : 'Attiva')
      .setStyle(ButtonStyle.Success)
      .setDisabled(enabled),
    new ButtonBuilder()
      .setCustomId('AUTOMOD_DISABLE')
      .setLabel(!enabled ? 'Già disattivato' : 'Disattiva')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!enabled),
  );
}

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

  if (!settings.automod) {
    settings.automod = { enabled: false };
  }

  const embed = buildAutomodEmbed(settings);
  const row = buildAutomodRow(settings);

  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}

export async function handleAutomodButtons(interaction) {
  if (!interaction.inGuild()) return;

  const guildId = interaction.guild.id;
  const id = interaction.customId;

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({
      content: '❌ Ti mancano i permessi per configurare AutoMod (Serve Manage Server).',
      ephemeral: true,
    });
  }

  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.automod) settings.automod = { enabled: false };

  if (id === 'AUTOMOD_ENABLE') {
    settings.automod.enabled = true;
  } else if (id === 'AUTOMOD_DISABLE') {
    settings.automod.enabled = false;
  } else {
    return;
  }

  const newEmbed = buildAutomodEmbed(settings);
  const row = buildAutomodRow(settings);

  // update = aggiorna il pannello originale (ephemerale)
  return interaction.update({
    embeds: [newEmbed],
    components: [row],
  });
}
