// commands/botinfo.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Percorsi compatibili con import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Legge package.json per recuperare la versione
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

// Utility
function formatYearsAgo(date) {
  const now = new Date();
  const years = Math.floor((now - date) / (1000 * 60 * 60 * 24 * 365));
  return years <= 0 ? 'meno di 1 anno fa' : `${years} ${years === 1 ? 'anno' : 'anni'} fa`;
}

function formatMB(bytes) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

// Slash command
export const data = new SlashCommandBuilder()
  .setName('botinfo')
  .setDescription('Mostra informazioni su Nimbus');

export async function execute(interaction) {
  const { client } = interaction;

  await interaction.deferReply({ ephemeral: false });

  const created = interaction.createdTimestamp;
  const apiPing = Math.round(client.ws.ping);

  const botCreatedAt = client.user.createdAt;
  const yearsAgo = formatYearsAgo(botCreatedAt);

  const mem = process.memoryUsage();
  const ram = formatMB(mem.rss);

  const platformMap = { win32: 'Windows', linux: 'Linux', darwin: 'macOS' };
  const platform = platformMap[process.platform] ?? process.platform;

  // Primo embed
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ name: 'Nimbus', iconURL: client.user.displayAvatarURL() })
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: '🤖 Bot',
        value:
          `**Ping:** \`${apiPing}ms\`\n` +
          `**Creato:** \`${yearsAgo}\`\n` +
          `**Versione:** \`v${pkg.version}\``,
        inline: true
      },
      {
        name: '📊 Stats',
        value:
          `**Ram:** \`${ram}\`\n` +
          `**Piattaforma:** \`${platform}\`\n` +
          `**Bot ID:** \`${client.user.id}\``,
        inline: true
      }
    )
    .setFooter({ text: 'Nimbus • /botinfo' })
    .setTimestamp();

  const reply = await interaction.editReply({ embeds: [embed] });

  const roundTrip = reply.createdTimestamp - created;

  // Embed finale aggiornato
  const finalEmbed = EmbedBuilder.from(embed)
    .addFields(
      {
        name: '⏱️ Extra',
        value: `**Round-trip:** \`${roundTrip}ms\``,
        inline: false
      },
      {
        name: '🔗 Links',
        value:
          `[🌐 Sito Ufficiale](https://nimbusbot.vercel.app/)\n` +
          `[💬 Server di Supporto](https://discord.gg/An9DGJHhg4)`
      }
    );

  await interaction.editReply({ embeds: [finalEmbed] });
}
