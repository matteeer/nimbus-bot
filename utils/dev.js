// utils/dev.js
/**
 * Risolve il canale "dev bug" dove inviare i report globali.
 * Priorità:
 *  1) DEV_BUG_CHANNEL_ID  -> canale specifico
 *  2) DEV_GUILD_ID + cerca canale #bug, #bugs, #segnalazioni
 *  3) DM a DEV_USER_ID (lo sviluppatore)
 *  4) DM all'owner dell'applicazione (fallback)
 */
export async function getDevBugTarget(client) {
  const channelId = process.env.DEV_BUG_CHANNEL_ID;
  if (channelId) {
    const ch = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(()=>null);
    if (ch && ch.isTextBased()) return { type: 'channel', target: ch };
  }

  const guildId = process.env.DEV_GUILD_ID;
  if (guildId) {
    const g = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(()=>null);
    if (g) {
      const guess = g.channels.cache.find(c =>
        c.isTextBased() && ['bug','bugs','segnalazioni','reports','nimbus-bugs'].some(n => c.name.toLowerCase().includes(n))
      ) || await (async () => {
        const chans = await g.channels.fetch().catch(()=>null);
        if (!chans) return null;
        return [...chans.values()].find(c =>
          c?.isTextBased && c.isTextBased() &&
          ['bug','bugs','segnalazioni','reports','nimbus-bugs'].some(n => c.name?.toLowerCase?.().includes(n))
        ) || null;
      })();
      if (guess && guess.isTextBased()) return { type: 'channel', target: guess };
    }
  }

  const devUserId = process.env.DEV_USER_ID;
  if (devUserId) {
    const user = await client.users.fetch(devUserId).catch(()=>null);
    if (user) return { type: 'dm', target: user };
  }

  // fallback: owner dell'app
  try {
    const app = client.application ?? await client.fetchApplication();
    const owner = app?.owner;
    if (owner?.send) return { type: 'dm', target: owner };
    if (owner?.user) return { type: 'dm', target: owner.user };
  } catch {}

  return null;
}
