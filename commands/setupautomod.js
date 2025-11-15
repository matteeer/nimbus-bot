// commands/automod.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { ensureGuild, getGuildSettings, saveGuild } from '../utils/settings.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configura le funzioni di Nimbus.')
  .addSubcommand(sub =>
    sub
      .setName('automod')
      .setDescription('Configura il sistema AutoMod.')
  );

export async function execute(interaction) {
  if (interaction.options.getSubcommand() !== 'automod') return;

  const guildId = interaction.guild.id;
  ensureGuild(guildId);

  const s = getGuildSettings(guildId);
  const enabled = s.automod?.enabled ?? false;

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
        '• Blocca parole vietate',
        '',
        `**Stato attuale:** \`${enabled ? 'Attivo' : 'Disattivo'}\``
      ].join('\n')
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
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

// HANDLER BOTTONI
export async function handleAutomodButtons(interaction) {
  const id = interaction.customId;
  const guildId = interaction.guild.id;

  ensureGuild(guildId);
  const s = getGuildSettings(guildId);

  if (id === 'AUTOMOD_ENABLE') {
    s.automod.enabled = true;
  } else if (id === 'AUTOMOD_DISABLE') {
    s.automod.enabled = false;
  }

  saveGuild(guildId, s);

  await interaction.reply({
    content: `✅ AutoMod è stato **${s.automod.enabled ? 'attivato' : 'disattivato'}**.`,
    ephemeral: true
  });
}
