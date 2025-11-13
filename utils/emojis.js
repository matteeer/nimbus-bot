// utils/emojis.js
import { PermissionFlagsBits } from 'discord.js';

export const EMOJI = {
  ok:  { id: '1175931981784162444', name: 'emoji_10', animated: false, fallback: '✅' },
  err: { id: '1175932013606342686', name: 'emoji_11', animated: false, fallback: '❌' },
};

// stringa <:name:id> se possibile, altrimenti fallback unicode
export function getEmojiString(client, key, guild) {
  const cfg = EMOJI[key];
  if (!cfg) return '';

  // se non siamo in una guild (DM) o manca il permesso, fallback
  const canExternal = guild?.members?.me?.permissions?.has?.(PermissionFlagsBits.UseExternalEmojis) ?? false;
  if (!guild || !canExternal) return cfg.fallback;

  const prefix = cfg.animated ? 'a' : '';
  return `<${prefix}:${cfg.name}:${cfg.id}>`;
}

// URL CDN dell’emoji per usarla come iconURL (author/footer)
export function getEmojiCdnUrl(key) {
  const cfg = EMOJI[key];
  if (!cfg) return null;
  const ext = cfg.animated ? 'gif' : 'png';
  return `https://cdn.discordapp.com/emojis/${cfg.id}.${ext}?quality=lossless`;
}
