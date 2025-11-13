// utils/warns.js
import fs from 'node:fs';
import path from 'node:path';

const DIR = './data';
const FILE = path.join(DIR, 'warns.json');

function load() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}');
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function save(db){ fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); }

export function addWarn(guildId, userId, modId, reason) {
  const db = load();
  if (!db[guildId]) db[guildId] = {};
  if (!db[guildId][userId]) db[guildId][userId] = [];
  const w = { modId, reason: reason || '—', ts: Date.now() };
  db[guildId][userId].push(w);
  save(db);
  return db[guildId][userId];
}

export function getWarns(guildId, userId) {
  const db = load();
  return (db[guildId]?.[userId] ?? []).slice();
}

export function clearWarns(guildId, userId) {
  const db = load();
  db[guildId] = db[guildId] || {};
  db[guildId][userId] = [];
  save(db);
  return [];
}

export function removeWarn(guildId, userId, index) {
  const db = load();
  const arr = db[guildId]?.[userId] ?? [];
  if (index < 1 || index > arr.length) return null;
  const removed = arr.splice(index-1, 1)[0];
  if (!db[guildId]) db[guildId] = {};
  db[guildId][userId] = arr;
  save(db);
  return removed;
}
