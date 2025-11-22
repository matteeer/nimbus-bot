import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('health')
  .setDescription('Esegue un controllo diagnostico completo sul bot.');

export async function execute(interaction) {

  const services = {
    discordApi: interaction.client.ws.status === 0 ? '🟢 Online' : '🔴 Problemi',
    token: process.env.TOKEN ? '🟢 Presente' : '🔴 MANCANTE',
    nodeVersion: process.version,
    commandsLoaded: interaction.client.commands.size,
  };

  const lastRestart = new Date(Date.now() - process.uptime() * 1000);

  const embed = new EmbedBuilder()
    .setTitle('🩺 Nimbus Diagnostics')
    .setColor('#5865F2')
    .addFields(
      { name: '📡 Discord API', value: services.discordApi, inline: true },
      { name: '🔑 Token', value: services.token, inline: true },
      { name: '📦 Comandi registrati', value: `${services.commandsLoaded}`, inline: true },
      { name: '🟦 Node.js', value: services.nodeVersion, inline: true },
      { name: '🔄 Ultimo restart', value: `<t:${Math.floor(lastRestart.getTime()/1000)}:R>` },
    )
    .setFooter({ text: 'Nimbus system check • Tutto sotto controllo 🤖' });

  await interaction.reply({ embeds: [embed] });
}
