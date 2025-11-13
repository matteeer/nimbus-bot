import fs from 'node:fs';
const PATH = './guild-settings.json';

export function loadSettings() {
  if (!fs.existsSync(PATH)) fs.writeFileSync(PATH, '{}');
  return JSON.parse(fs.readFileSync(PATH, 'utf8'));
}

export function saveSettings(data) {
  fs.writeFileSync(PATH, JSON.stringify(data, null, 2));
}

export function ensureGuildDefaults(settings, guildId) {
  if (!settings[guildId]) {
    settings[guildId] = {
      createdAt: new Date().toISOString()
      
    };
    saveSettings(settings);
  }
}
