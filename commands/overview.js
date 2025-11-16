// commands/overview.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ensureGuild, getGuildSettings } from '../utils/settings.js';

export const data = new SlashCommandBuilder()
  .setName('overview')
  .setDescription('Mostra una panoramica della configurazione di Nimbus in questo server.')
  .setDMPermission(false);

function formatChannel(guild, id) {
  if (!id) return '`Nessuno`';
  const ch = guild.channels.cache.get(id);
  return ch ? `${ch}` : `\`#${id}\``;
}

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

  const logChannel = settings.logChannelId ?? null;
  const ticketsChannel = settings.channels?.ticketsChannelId ?? null;
  const reportsChannel = settings.channels?.reportsChannelId ?? null;

  const welcome = settings.welcome ?? {};
  const welcomeEnabled = !!welcome.enabled;
  const welcomeChannel = welcome.channelId ?? null;

  const automod = settings.automod ?? {};
  const automodEnabled = !!automod.enabled;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Configurazione Nimbus')
    .setThumbnail(guild.iconURL({ size: 256 }) ?? null)
    .addFields(
      {
        name: '📌 Log',
        value: [
          `**Canale log:** ${formatChannel(guild, logChannel)}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '🎫 Servizi',
        value: [
          `**Tickets:** ${formatChannel(guild, ticketsChannel)}`,
          `**Reports:** ${formatChannel(guild, reportsChannel)}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '👋 Welcome',
        value: [
          `**Stato:** \`${welcomeEnabled ? 'Attivo' : 'Disattivato'}\``,
          `**Canale:** ${formatChannel(guild, welcomeChannel)}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '🛡️ AutoMod',
        value: `**Stato:** \`${automodEnabled ? 'Attivo' : 'Disattivato'}\``,
        inline: false,
      },
    )
    .setFooter({ text: 'Nimbus • /overview' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed], ephemeral: false });
}
