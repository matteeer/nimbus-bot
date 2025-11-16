// commands/overview.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';

import { ensureGuild, getGuildSettings } from '../utils/settings.js';

export const data = new SlashCommandBuilder()
  .setName('overview')
  .setDescription('Mostra una panoramica della configurazione di Nimbus in questo server.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

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

  const w = settings.welcome ?? {};
  const a = settings.automod ?? {};
  const t = settings.tickets ?? null; // se in futuro hai una config tickets

  const welcomeStatus = w.enabled ? 'Attivo' : 'Disattivo';
  const welcomeChannel = w.channelId ? `<#${w.channelId}>` : 'Non impostato';
  const welcomeRole = w.autoroleId ? `<@&${w.autoroleId}>` : 'Nessun ruolo automatico';
  const modeIsEmbed = w.embed?.enabled ?? (w.mode !== 'text');
  const welcomeMode = modeIsEmbed ? 'Embed' : 'Messaggio semplice';

  const automodStatus = a.enabled ? 'Attivo' : 'Disattivo';

  const ticketsStatus = t ? 'Configurazione presente' : 'Non configurati';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Panoramica Nimbus')
    .setDescription('Stato delle principali funzioni di Nimbus in questo server.')
    .addFields(
      {
        name: 'Welcome',
        value: [
          `• Stato: \`${welcomeStatus}\``,
          `• Canale: ${welcomeChannel}`,
          `• Ruolo automatico: ${welcomeRole}`,
          `• Modalità: \`${welcomeMode}\``,
        ].join('\n'),
        inline: false,
      },
      {
        name: 'AutoMod',
        value: `• Stato: \`${automodStatus}\``,
        inline: false,
      },
      {
        name: 'Tickets',
        value: `• Stato: \`${ticketsStatus}\``,
        inline: false,
      },
    )
    .setFooter({
      text: `Server: ${guild.name}`,
      iconURL: guild.iconURL({ size: 128 }) ?? undefined,
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
