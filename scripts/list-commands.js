// scripts/list-commands.js
import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const { DISCORD_TOKEN: TOKEN, CLIENT_ID, GUILD_ID } = process.env;
const rest = new REST({ version: '10' }).setToken(TOKEN);

const fmt = (arr) => arr.map(c => c.name).join(', ') || '—';

const globals = await rest.get(Routes.applicationCommands(CLIENT_ID));
console.log('🌐 GLOBAL:', globals.length, '|', fmt(globals));

if (GUILD_ID) {
  const guilds = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
  console.log(`🏠 GUILD ${GUILD_ID}:`, guilds.length, '|', fmt(guilds));
} else {
  console.log('ℹ️ Imposta GUILD_ID nello .env per ispezionare una guild.');
}
