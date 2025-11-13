// utils/ui.js
import { EmbedBuilder, Colors } from 'discord.js';

export function nEmbed(client, {
  title = 'Info',
  description = '',
  color = Colors.Blurple,
  thumbnail = null,
  image = null,
  // icon dismesso: usiamo SEMPRE l’avatar del bot
} = {}) {
  const e = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: title,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setDescription(description || null)
    .setFooter({ text: client.user.username })
    .setTimestamp();

  if (thumbnail) e.setThumbnail(thumbnail);
  if (image) e.setImage(image);
  return e;
}

export function lineBreak(n = 1) { return '\n'.repeat(Math.max(1, n)); }
export function kv(name, value, inline = false) { return { name, value, inline }; }
