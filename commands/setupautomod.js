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
  .setName('setup')
  .setDescription('Configura le funzioni di Nimbus.')
  .addSubcommand(sub =>
    sub
      .setName('automod')
      .setDescription('Configura il sistema AutoMod.'),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

export async function execute(interaction) {
  if (interaction.options.getSubcommand() !== 'automod') return;

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
        'Configurazione del sistema AutoMod.',
        '',
        '**Funzionalità principali**',
        '• Rilevamento spam',
        '• Rilevamento mass mention',
        '• Blocca alcune parole vietate',
        '',
        `**Stato attuale:** \`${enabled ? 'Attivo' : 'Disattivo'}\``,
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
  });
}

export async function handleAutomodButtons(interaction) {
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

  await interaction.reply({
    content: `✅ AutoMod è stato **${settings.automod.enabled ? 'attivato' : 'disattivato'}**.`,
    ephemeral: true,
  });
}
