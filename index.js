import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActivityType,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ensureGuild, getGuildSettings, saveGuildSettings } from './utils/settings.js';
import { registerAutomod } from './automod/index.js';
import { handleHelpButton } from './commands/help.js';
import { handleTicketButton, handleTicketModal } from './commands/ticket.js';
import { handleLockButton } from './commands/lock.js';
import { handleAutomodButtons } from './commands/setupautomod.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN o CLIENT_ID mancanti nello .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

// ===== Load comandi runtime =====
const commandsPath = path.join(__dirname, 'commands');
async function attachRuntimeCommands() {
  if (!fs.existsSync(commandsPath)) return;
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    try {
      const mod = await import(`./commands/${file}`);
      if (mod?.data && mod?.execute) client.commands.set(mod.data.name, mod);
    } catch (e) {
      console.error(`❌ Errore nel caricare ${file}:`, e);
    }
  }
}
await attachRuntimeCommands();

// ===== Presenza dinamica =====
const startedAt = Date.now();
function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

function startPresenceRotation() {
  let i = 0;
  setInterval(() => {
    const activities = [
      { name: `Nimbus v1.0 ⚙️`, type: ActivityType.Watching },
      { name: `💬 Scrivi /help per iniziare`, type: ActivityType.Watching },
      { name: `🕒 Uptime: ${formatUptime(Date.now() - startedAt)}`, type: ActivityType.Competing }
    ];
    const next = activities[i % activities.length];
    try { client.user.setPresence({ activities: [next], status: 'online' }); } catch {}
    i++;
  }, 45_000);
}

// ===== READY =====
client.once(Events.ClientReady, async c => {
  console.log(`✅ ${c.user.tag} online | Guilds: ${c.guilds.cache.size}`);
  startPresenceRotation();
});

// ===== Funzioni Welcome =====
async function handleWelcomeSelect(interaction) {
  ensureGuild(interaction.guild.id);
  const settings = getGuildSettings(interaction.guild.id);

  const selectedChannelId = interaction.values[0];
  settings.welcome.channelId = selectedChannelId;
  await saveGuildSettings(interaction.guild.id, settings);

  await interaction.reply({ content: `✅ Canale welcome impostato su <#${selectedChannelId}>`, ephemeral: true });
}

async function handleWelcomeButton(interaction) {
  ensureGuild(interaction.guild.id);
  const settings = getGuildSettings(interaction.guild.id);

  settings.welcome.enabled = !settings.welcome.enabled;
  await saveGuildSettings(interaction.guild.id, settings);

  const status = settings.welcome.enabled ? '🟢 Attivo' : '🔴 Disattivato';

  // Select menu canali
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('NIMBUS_WEL_SELECT')
      .setPlaceholder('Seleziona il canale di benvenuto')
      .addOptions(
        interaction.guild.channels.cache
          .filter(c => c.isTextBased())
          .map(c => ({ label: c.name, value: c.id }))
      )
  );

  // Toggle button
  const toggleButton = new ButtonBuilder()
    .setCustomId('NIMBUS_WEL_TOGGLE')
    .setLabel(settings.welcome.enabled ? 'Disattiva' : 'Attiva')
    .setStyle(settings.welcome.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const buttonRow = new ActionRowBuilder().addComponents(toggleButton);

  const embed = new EmbedBuilder()
    .setTitle('🤖 Welcome Panel')
    .setDescription(`Stato: **${status}**\nSeleziona un canale e premi Attiva per salvare`)
    .setColor('#5865F2');

  await interaction.update({ embeds: [embed], components: [row, buttonRow] });
}

// ===== Interaction handler =====
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      await cmd.execute(interaction);

    } else if (interaction.isButton()) {
      const id = interaction.customId;
      if (id.startsWith('HELP_')) return await handleHelpButton(interaction);
      if (id.startsWith('NIMBUS_WEL_')) return await handleWelcomeButton(interaction);
      if (id.startsWith('NIMBUS_TICKET_')) return await handleTicketButton(interaction);
      if (id.startsWith('NIMBUS_LOCK_')) return await handleLockButton(interaction);
      if (id.startsWith('AUTOMOD_')) return await handleAutomodButtons(interaction);

    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('NIMBUS_WEL')) return handleWelcomeSelect(interaction);

    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === 'NIMBUS_WEL_MODAL_MSG') return; // se vuoi il messaggio custom
      if (interaction.customId.startsWith('NIMBUS_TICKET_MODAL_')) return await handleTicketModal(interaction);
    }
  } catch (e) {
    console.error('Interaction handler error:', e);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Errore', ephemeral: true }).catch(() => {});
    }
  }
});

// ===== Welcome join =====
client.on(Events.GuildMemberAdd, async member => {
  try {
    ensureGuild(member.guild.id);
    const settings = getGuildSettings(member.guild.id);
    const w = settings.welcome;
    if (!w?.enabled || !w.channelId) return;

    const ch =
      member.guild.channels.cache.get(w.channelId) ??
      await member.guild.channels.fetch(w.channelId).catch(() => null);
    if (!ch || !ch.isTextBased()) return;

    const mention = w.pingUser ? member.toString() : `**${member.user.tag}**`;
    const allowedMentions = w.pingUser ? { users: [member.id] } : { parse: [] };
    const msg = w.message?.replace('{user}', mention).replace('{server}', member.guild.name) || `${mention} è entrato in **${member.guild.name}** 🎉`;

    if (w.embed?.enabled) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Benvenuto!')
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setTimestamp();
      await ch.send({ content: w.pingUser ? mention : null, embeds: [embed], allowedMentions });
    } else {
      await ch.send({ content: msg, allowedMentions });
    }
  } catch (e) {
    console.error('welcome join error:', e);
  }
});

// ===== AutoMod bootstrap =====
registerAutomod(client);

// ===== Login =====
client.login(TOKEN).catch(err => {
  console.error('❌ Login fallito', err);
  process.exit(1);
});
