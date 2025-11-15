// commands/uptime.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('uptime')
  .setDescription('Mostra da quanto tempo Nimbus è online.');

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

export async function execute(interaction) {
  const { client } = interaction;

  const uptimeMs = client.uptime ?? 0;
  const uptimeStr = formatDuration(uptimeMs);

  const readyAt = client.readyAt
    ? `<t:${Math.floor(client.readyAt.getTime() / 1000)}:f>`
    : 'N/D';

  const botUser = client.user;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: botUser.tag,
      iconURL: botUser.displayAvatarURL({ size: 128 })
    })
    .setTitle('Nimbus Uptime')
    .setDescription(
      [
        '✅ Nimbus è operativo.',
        '',
        `• **Uptime:** \`${uptimeStr}\``,
        `• **Ultimo avvio:** ${readyAt}`
      ].join('\n')
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
