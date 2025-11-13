// deploy-commands.js
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN o CLIENT_ID mancanti nello .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const commands = [];
const cmdPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))) {
  const mod = await import(`./commands/${file}`);
  if (mod?.data) commands.push(mod.data.toJSON());
}

console.log(`⏫ Deploy GLOBAL (${commands.length}) → app ${CLIENT_ID}`);
await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
console.log('✅ Comandi GLOBAL registrati.');
