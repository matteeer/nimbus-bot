// scripts/clean-guilds-all.js
import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN o CLIENT_ID mancanti nello .env');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async (c) => {
  try {
    const guilds = await c.guilds.fetch();
    for (const g of guilds.values()) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, g.id), { body: [] });
      console.log(`🧼 Guild ${g.id}: comandi svuotati`);
    }
  } catch (e) {
    console.error('Errore clean all guilds:', e);
  } finally {
    process.exit(0);
  }
});

client.login(TOKEN);

