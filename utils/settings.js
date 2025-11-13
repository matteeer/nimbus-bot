// utils/settings.js
import fs from 'node:fs';
const PATH = './guild-settings.json';

function loadRaw() {
  if (!fs.existsSync(PATH)) fs.writeFileSync(PATH, '{}');
  return JSON.parse(fs.readFileSync(PATH, 'utf8'));
}
function saveRaw(db) { fs.writeFileSync(PATH, JSON.stringify(db, null, 2)); }

function defaults() {
  return {
    modLogChannelId: null,
    // canali opzionali
    ticketsChannelId: null,
    bugChannelId: null,
    userReportsChannelId: null,
    welcomeChannelId: null, // alias interno se servisse
    // welcome
    welcome: {
      enabled: false,
      channelId: null,
      message: 'Benvenuto {user} in **{server}**! 🎉',
    },
    // automod
    automod: {
      enabled: true,
      antispam:  { enabled: true, windowMs: 7000, maxMsgs: 6, repeatTrigger: 3, timeoutMs: 10 * 60 * 1000 },
      antiflood: { enabled: true, windowMs: 4000, maxMsgs: 5, timeoutMs:  5 * 60 * 1000 },
      antiscam:  { enabled: true, timeoutMs: 60 * 60 * 1000 },
      antiraid:  { enabled: true, windowMs: 60 * 1000, joinSpike: 6, raidTimeoutMs: 5 * 60 * 1000 },
      captcha:   { enabled: true, timeoutFailMs: 60 * 60 * 1000, timeToSolveMs: 90_000, codeLength: 5 },
      antinuke:  { enabled: true, windowMs: 45 * 1000, channelDeletes: 4, roleDeletes: 4, memberKicks: 5, actionTimeoutMs: 60 * 60 * 1000 },
    }
  };
}

export function ensureGuild(guildId) {
  const db = loadRaw();
  if (!db[guildId]) { db[guildId] = defaults(); saveRaw(db); }
  else {
    const def = defaults();
    db[guildId] = {
      ...def,
      ...db[guildId],
      automod: { ...def.automod, ...(db[guildId].automod ?? {}) }
    };
    saveRaw(db);
  }
  return db[guildId];
}

export function getGuildSettings(guildId) {
  const db = loadRaw();
  return db[guildId] ?? ensureGuild(guildId);
}

export function setGuildSettings(guildId, partial) {
  const db = loadRaw();
  const cur = db[guildId] ?? defaults();
  db[guildId] = {
    ...cur,
    ...partial,
    automod: { ...cur.automod, ...(partial.automod ?? {}) },
    welcome: { ...cur.welcome, ...(partial.welcome ?? {}) }
  };
  saveRaw(db);
  return db[guildId];
}
