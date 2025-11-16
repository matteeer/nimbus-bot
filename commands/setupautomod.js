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

  const enabled = !!settings.automod.enabled;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('AutoMod')
    .setDescription(
      [
        'Configurazione del sistema AutoMod di Nimbus.',
        '',
        '**Cosa fa:**',
        '• Controllo spam/flood di base',
        '• Controllo mass mention',
        '• Blocca alcune parole vietate predefinite',
        '',
        `**Stato attuale:** \`${enabled ? 'Attivo' : 'Disattivato'}\``,
      ].join('\n'),
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('AUTOMOD_ENABLE')
      .setLabel('Attiva')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('AUTOMOD_DISABLE')
      .setLabel('Disattiva')
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}

export async function handleAutomodButtons(interaction) {
  if (!interaction.inGuild()) return;

  const id = interaction.customId;
  const guildId = interaction.guild.id;

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

  const enabled = settings.automod.enabled;

  try {
    await interaction.reply({
      content: `✅ AutoMod è stato **${enabled ? 'attivato' : 'disattivato'}**.`,
      ephemeral: true,
    });
  } catch {
    // se ha già risposto, ignora
  }
}
