// utils/logger.js
import { EmbedBuilder, Colors } from 'discord.js';
import { getGuildSettings } from './settings.js';

export function modEmbed({ title = 'Nimbus • Moderazione', description = '', color = Colors.Blurple }) {
  return new EmbedBuilder().setColor(color).setAuthor({ name: title }).setDescription(description).setTimestamp();
}

export async function sendModLog(guild, embed) {
  try {
    const { modLogChannelId } = getGuildSettings(guild.id);
    if (!modLogChannelId) return false;
    const ch = guild.channels.cache.get(modLogChannelId) ?? await guild.channels.fetch(modLogChannelId).catch(() => null);
    if (!ch || !ch.isTextBased()) return false;
    await ch.send({ embeds: [embed] });
    return true;
  } catch {
    return false;
  }
}
