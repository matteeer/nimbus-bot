// index.js
import 'dotenv/config';
import {
  Client, GatewayIntentBits, Partials, Events, ActivityType,
  Collection, EmbedBuilder, REST, Routes, MessageFlags,
  Status
} from 'discord.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// === Utils & moduli del progetto ===
import { registerAutomod } from './automod/index.js';
import { ensureGuild, getGuildSettings } from './utils/settings.js';
import { nEmbed } from './utils/ui.js';

// Handlers componenti
import { handleHelpButton } from './commands/help.js';
import { handleTicketButton, handleTicketModal } from './commands/ticket.js';
import {
  handleWelcomeButton,
  handleWelcomeModal,
  handleWelcomeSelect,
  handleWelcomeThumbUrlModal
} from './commands/welcome.js';

// === Setup pathing ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Env ===
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
if (!TOKEN || !CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN o CLIENT_ID mancanti nello .env');
  process.exit(1);
}

// === Client ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,      // welcome & autorole
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,    // automod (se lo usi)
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// ===== Loader comandi (runtime) =====
const commandsPath = path.join(__dirname, 'commands');

function listCommandFiles() {
  if (!fs.existsSync(commandsPath)) return [];
  return fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
}
async function attachRuntimeCommands() {
  const files = listCommandFiles();
  for (const file of files) {
    try {
      const mod = await import(`./commands/${file}`);
      if (mod?.data && mod?.execute) {
        client.commands.set(mod.data.name, { data: mod.data, execute: mod.execute });
      }
    } catch (e) {
      console.error(`❌ Errore nel caricare ${file}:`, e);
    }
  }
}
await attachRuntimeCommands();

// ===== Presenza dinamica =====
let presenceTimer = null;
const startedAt = Date.now();

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}
function buildActivities(c) {
  const guilds = c.guilds.cache.size;
  const users = c.users.cache.size || '—';
  const up = formatUptime(Date.now() - startedAt);
  return [
    { name: `Nimbus v1.0 ⚙️`, type: ActivityType.Watching },
    { name: `⚙️ /setup per configurare Nimbus`, type: ActivityType.Playing },
    { name: `🧠 Automoderazione attiva`, type: ActivityType.Listening },
    { name: `📩 Gestendo ticket e report`, type: ActivityType.Playing },
    { name: `🕒 Uptime: ${up}`, type: ActivityType.Competing },
    { name: `💬 Scrivi /help per iniziare`, type: ActivityType.Watching },
    { name: `🛡️ Proteggendo la community`, type: ActivityType.Playing },
    { name: `Powered by Nimbus Technologies ☁️`, type: ActivityType.Competing },
  ];
}
function safeSetPresence(c, activity) {
  try {
    c.user.setPresence({ activities: [activity], status: 'online' });
  } catch { /* no-op */ }
}
function startPresenceRotation(c) {
  let i = 0;

  function updatePresence() {
    const status = c.user?.presence?.status;
    const up = formatUptime(Date.now() - startedAt);

    // se il bot è in manutenzione (idle/dnd)
    if (status === 'idle' || status === 'dnd') {
      const maintList = [
        { name: `🧰 Manutenzione in corso`, type: ActivityType.Playing },
        { name: `⚙️ Aggiornamenti del sistema Nimbus`, type: ActivityType.Watching },
        { name: `🔄 Riavvio dei moduli`, type: ActivityType.Listening },
        { name: `🕒 Uptime: ${up}`, type: ActivityType.Competing },
      ];
      const m = maintList[i % maintList.length];
      try { c.user.setPresence({ activities: [m], status }); } catch {}
      i++;
      return;
    }

    // normale rotazione
    const list = buildActivities(c);
    const next = list[i % list.length];
    try { c.user.setPresence({ activities: [next], status: 'online' }); } catch {}
    i++;
  }

  updatePresence(); // prima esecuzione
  presenceTimer = setInterval(updatePresence, 45_000);
}

function stopPresenceRotation() {
  if (presenceTimer) clearInterval(presenceTimer);
  presenceTimer = null;
}

// ===== READY: presenza + BOOT-FIX (pulisci SEMPRE GUILD) =====
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ ${c.user.tag} (Nimbus) online | Guilds: ${c.guilds.cache.size}`);
  startPresenceRotation(c);

  // BOOT-FIX: svuota i comandi GUILD (teniamo solo GLOBAL)
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    const guilds = await c.guilds.fetch();
    for (const g of guilds.values()) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, g.id), { body: [] });
      console.log(`🧽 Puliti GUILD commands su ${g.id}`);
    }
  } catch (e) {
    console.error('Errore pulizia GUILD on-boot:', e);
  }
});

// Quando il bot entra in un nuovo server → pulisci i comandi GUILD (niente doppioni)
client.on(Events.GuildCreate, async (guild) => {
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), { body: [] });
    console.log(`🧽 Puliti GUILD commands su nuova guild ${guild.id}`);
  } catch (e) {
    console.error(`Errore pulizia GUILD su nuova guild ${guild.id}:`, e);
  }
});

// ===== Interazioni (slash, bottoni, select, modali) =====
client.on(Events.InteractionCreate, async (interaction) => {
  // Slash
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(err);
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription('❌ Errore durante l’esecuzione del comando.')
        .setTimestamp();
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
    return;
  }

  // Bottoni
  if (interaction.isButton()) {
    try {
      const id = interaction.customId;
      if (id.startsWith('HELP_')) return await handleHelpButton(interaction);
      if (id.startsWith('NIMBUS_WEL_')) return await handleWelcomeButton(interaction);
      if (id.startsWith('NIMBUS_TICKET_')) return await handleTicketButton(interaction);
      if (id.startsWith('NIMBUS_LOCK_')) return await handleLockButton(interaction);
    } catch (e) {
      console.error('Button handler error:', e);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Qualcosa è andato storto.', flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
    return;
  }

  // Select menu (string/role/channel/user/mentionable)
  if (
    interaction.isStringSelectMenu() ||
    interaction.isRoleSelectMenu() ||
    interaction.isChannelSelectMenu() ||
    interaction.isUserSelectMenu() ||
    interaction.isMentionableSelectMenu()
  ) {
    try {
      const id = interaction.customId;
      if (id.startsWith('NIMBUS_WEL_')) {
        return await handleWelcomeSelect(interaction);
      }
    } catch (e) {
      console.error('Select handler error:', e);
    }
    return;
  }

  // Modali
  if (interaction.isModalSubmit()) {
    try {
      const id = interaction.customId;

      // Welcome: URL thumbnail custom (modale dedicata)
      if (id === 'NIMBUS_WEL_MODAL_THUMBURL') {
        return await handleWelcomeThumbUrlModal(interaction);
      }
      // Welcome: altre modali (testo, embed, image, footer)
      if (id.startsWith('NIMBUS_WEL_MODAL_')) {
        return await handleWelcomeModal(interaction);
      }
      // Ticket modali
      if (
        id.startsWith('NIMBUS_TICKET_MODAL_') ||
        id === 'NIMBUS_TICKET_ADD_MODAL' ||
        id === 'NIMBUS_TICKET_REM_MODAL'
      ) {
        return await handleTicketModal(interaction);
      }
    } catch (e) {
      console.error('Modal handler error:', e);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Errore nella modale.', flags: MessageFlags.Ephemeral }).catch(()=>{});
      }
    }
    return;
  }
});

// ===== Welcome on join (mention nel content, MAI nell’embed) =====
client.on('guildMemberAdd', async (member) => {
  try {
    ensureGuild(member.guild.id);
    const s = getGuildSettings(member.guild.id);
    const w = s.welcome ?? {};
    if (!w.enabled) return;

    // autorole (se impostato)
    if (w.autoroleId) {
      const role =
        member.guild.roles.cache.get(w.autoroleId) ||
        await member.guild.roles.fetch(w.autoroleId).catch(() => null);
      if (role) member.roles.add(role).catch(() => {});
    }

    // canale di benvenuto
    const channelId = w.channelId ?? s.welcomeChannelId ?? null;
    const ch = channelId
      ? (member.guild.channels.cache.get(channelId) ??
         await member.guild.channels.fetch(channelId).catch(() => null))
      : null;
    if (!ch || !ch.isTextBased()) return;

    const pingUser = w.pingUser ?? true;
    const mention = pingUser ? member.toString() : `**@${member.user.username}**`;
    const allowedMentions = pingUser ? { users: [member.id] } : { parse: [] };

    if (w.embed?.enabled) {
      const title = (w.embed.title || 'Benvenuto {user}!')
        .replaceAll('{user}', `**@${member.user.username}**`)
        .replaceAll('{server}', member.guild.name);

      const description = (w.embed.description || 'Sei entrato in **{server}** 🎉')
        .replaceAll('{user}', `**@${member.user.username}**`)
        .replaceAll('{server}', member.guild.name);

      const embed = nEmbed(member.client, { title, description, color: w.embed.color ?? undefined });

      let thumb = null;
      if (w.embed.thumbnail === 'user') thumb = member.user.displayAvatarURL({ size: 256 });
      else if (w.embed.thumbnail === 'server') thumb = member.guild.iconURL({ size: 256 });
      else if (w.embed.thumbnail === 'custom') thumb = w.embed.customThumbUrl;
      if (thumb) embed.setThumbnail(thumb);
      if (w.embed.imageUrl) embed.setImage(w.embed.imageUrl);
      if (w.embed.footer) embed.setFooter({ text: w.embed.footer });

      await ch.send({ content: mention, embeds: [embed], allowedMentions }).catch(()=>{});
    } else {
      const text = (w.message || 'Benvenuto {user} in **{server}**! 🎉')
        .replaceAll('{user}', mention)
        .replaceAll('{server}', member.guild.name);
      await ch.send({ content: text, allowedMentions }).catch(()=>{});
    }
  } catch (e) {
    console.error('welcome error:', e);
  }
});

// ===== AutoMod bootstrap =====
registerAutomod(client);

// ===== Login =====
client.login(TOKEN).catch(err => {
  console.error('❌ Login fallito. Controlla DISCORD_TOKEN e le Intents.', err);
  process.exit(1);
});

// ===== Graceful shutdown =====
async function gracefulShutdown(label = 'shutdown') {
  try {
    console.log(`\n🛑 Nimbus: ${label}…`);
    stopPresenceRotation();
    try { client.user?.setPresence({ status: 'invisible' }); } catch {}
    await client.destroy();
  } catch (e) {
    console.error('Errore in gracefulShutdown:', e);
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (err) => { console.error(err); gracefulShutdown('uncaughtException'); });
process.on('unhandledRejection', (r) => { console.error(r); gracefulShutdown('unhandledRejection'); });

