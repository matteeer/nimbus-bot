// utils/warnStore.js
import fs from 'node:fs';
const PATH = './moderation.json';

function load() {
  if (!fs.existsSync(PATH)) fs.writeFileSync(PATH, JSON.stringify({ warns:{} }, null, 2));
  return JSON.parse(fs.readFileSync(PATH, 'utf8'));
}
function save(db) { fs.writeFileSync(PATH, JSON.stringify(db, null, 2)); }

export function addWarn(guildId, userId, data) {
  const db = load();
  if (!db.warns[guildId]) db.warns[guildId] = {};
  if (!db.warns[guildId][userId]) db.warns[guildId][userId] = [];
  db.warns[guildId][userId].push({ ...data, ts: Date.now() });
  save(db);
  return db.warns[guildId][userId].length;
}

export function listWarns(guildId, userId) {
  const db = load();
  return (db.warns[guildId]?.[userId] ?? []).slice();
}

export function removeWarn(guildId, userId, index1based) {
  const db = load();
  const arr = db.warns[guildId]?.[userId];
  if (!arr || index1based < 1 || index1based > arr.length) return false;
  arr.splice(index1based - 1, 1);
  save(db);
  return true;
}

export function clearWarns(guildId, userId) {
  const db = load();
  if (!db.warns[guildId]?.[userId]) return 0;
  const n = db.warns[guildId][userId].length;
  db.warns[guildId][userId] = [];
  save(db);
  return n;
}
