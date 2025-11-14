// commands/uptime.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

function formatUptime(ms) {
  let seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

export const data = new SlashCommandBuilder()
  .setName('uptime')
  .setDescription('Mostra da quanto tempo Nimbus è online');

export async function execute(interaction) {
  const { client } = interaction;
  const uptime = client.uptime ?? 0;
  const formatted = formatUptime(uptime);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: 'Nimbus • Uptime' })
    .setDescription(`🕒 Nimbus è online da: \`${formatted}\``)
    .setFooter({ text: 'Nimbus • /uptime' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
