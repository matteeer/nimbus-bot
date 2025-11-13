// automod/index.js
import {
  Collection,
  PermissionsBitField,
  Events,
  Colors,
  ChannelType,
} from 'discord.js';
import { suspiciousDomains } from './scamDomains.js';
import { getGuildSettings } from '../utils/settings.js';
import { modEmbed, sendModLog } from '../utils/logger.js';

// ===== CONFIG =====
function getConfig(guildId) {
  return getGuildSettings(guildId).automod;
}

// ===== UTILS =====
const now = () => Date.now();
const isMod = (m) => {
  const p = m?.permissions;
  if (!p) return false;
  return (
    p.has(PermissionsBitField.Flags.Administrator) ||
    p.has(PermissionsBitField.Flags.ManageGuild) ||
    p.has(PermissionsBitField.Flags.BanMembers) ||
    p.has(PermissionsBitField.Flags.KickMembers) ||
    p.has(PermissionsBitField.Flags.ModerateMembers)
  );
};
const genCode = (n = 5) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

// cerca un canale testuale adatto (#verify / #verifica / #captcha / #verification)
function findCaptchaBaseChannel(guild) {
  const names = ['verify', 'verifica', 'captcha', 'verification'];
  return (
    guild.channels.cache.find(
      (ch) => ch.type === ChannelType.GuildText && names.includes(ch.name.toLowerCase())
    ) ?? null
  );
}

// ===== STATE =====
const msgBuckets = new Collection(); // antiflood
const repeatBuckets = new Collection(); // antispam
const joinBuckets = new Collection(); // antiraid
const raidMode = new Collection(); // flag per guild
const captchaSessions = new Collection(); // userId -> { code,guildId,expiresAt,threadId? }
const nukeCounters = {
  channelDelete: new Collection(),
  roleDelete: new Collection(),
  memberKick: new Collection(),
};

// ===== REGISTER =====
export function registerAutomod(client) {
  console.log('🛡️ AutoMod init');

  client.on(Events.ClientReady, (c) => {
    for (const [gid, g] of c.guilds.cache) {
      console.log(`🛡️ ON → ${g.name} (${gid})`);
    }
  });

  // === AntiRaid + Captcha (DM con fallback thread)
  client.on(Events.GuildMemberAdd, async (member) => {
    const cfg = getConfig(member.guild.id);
    if (!cfg.enabled) return;

    // spike di join → raid mode
    const key = member.guild.id;
    const t = now();
    const arr = joinBuckets.get(key) ?? [];
    const next = [...arr.filter((ts) => ts >= t - cfg.antiraid.windowMs), t];
    joinBuckets.set(key, next);

    if (cfg.antiraid.enabled && next.length >= cfg.antiraid.joinSpike && !raidMode.get(key)) {
      raidMode.set(key, true);
      await sendModLog(
        member.guild,
        modEmbed({
          title: 'AntiRaid',
          color: Colors.Orange,
          description: `Raid mode **ON** (join spike: ${next.length})`,
        })
      );
      setTimeout(async () => {
        raidMode.set(key, false);
        await sendModLog(
          member.guild,
          modEmbed({ title: 'AntiRaid', color: Colors.Orange, description: `Raid mode **OFF**` })
        );
      }, cfg.antiraid.raidTimeoutMs);
    }

    // Captcha abilitato
    if (!cfg.captcha.enabled) return;

    const code = genCode(cfg.captcha.codeLength);
    const expiresAt = t + cfg.captcha.timeToSolveMs;
    captchaSessions.set(member.id, { code, guildId: member.guild.id, expiresAt, threadId: null });

    let delivered = false;

    // 1) prova DM
    try {
      await member.send(
        `👋 Benvenuto in **${member.guild.name}**!\n` +
          `Rispondi a questo DM con il codice **\`${code}\`** entro ` +
          `${Math.round(cfg.captcha.timeToSolveMs / 1000)}s per verificarti.`
      );
      delivered = true;
    } catch {
      delivered = false;
    }

    // 2) fallback: thread privato in #verify / #verifica / #captcha / #verification
    if (!delivered) {
      const base = findCaptchaBaseChannel(member.guild);
      if (base) {
        try {
          const thread = await base.threads
            .create({
              name: `verify-${member.user.username}`.slice(0, 90),
              autoArchiveDuration: 60, // min
              type: ChannelType.PrivateThread,
              reason: 'Captcha fallback: DM chiusi',
            })
            .catch(() => null);

          if (thread) {
            await thread.members.add(member.id).catch(() => {});
            await thread
              .send(
                `👋 Ciao ${member}, hai i DM chiusi.\n` +
                  `Per verificarti, scrivi qui il codice **\`${code}\`** entro ` +
                  `${Math.round(cfg.captcha.timeToSolveMs / 1000)}s.`
              )
              .catch(() => {});
            const sess = captchaSessions.get(member.id);
            if (sess) {
              sess.threadId = thread.id;
              captchaSessions.set(member.id, sess);
            }
            delivered = true;
          }
        } catch {
          /* ignore */
        }
      }
    }

    // 3) se ancora non consegnato
    if (!delivered) {
      if (raidMode.get(member.guild.id)) {
        await member.kick('Captcha non consegnabile (raid mode)').catch(() => {});
        await sendModLog(
          member.guild,
          modEmbed({
            title: 'Captcha',
            color: Colors.Red,
            description: `${member.user.tag} • DM fallito e nessun canale verify → **kick** (raid mode)`,
          })
        );
        return;
      } else {
        await member
          .timeout(
            cfg.captcha.timeoutFailMs,
            'Captcha non consegnabile (DM chiusi, nessun canale verify)'
          )
          .catch(() => {});
        await sendModLog(
          member.guild,
          modEmbed({
            title: 'Captcha',
            color: Colors.Red,
            description: `${member.user.tag} • DM fallito e nessun canale verify → **timeout**`,
          })
        );
        return;
      }
    }

    // 4) scadenza captcha: non risolto → kick (raid) o timeout
    setTimeout(async () => {
      const sess = captchaSessions.get(member.id);
      if (sess && sess.expiresAt <= Date.now()) {
        captchaSessions.delete(member.id);

        // chiudi il thread se esiste
        if (sess.threadId) {
          const thread = await member.guild.channels.fetch(sess.threadId).catch(() => null);
          if (thread?.isThread()) {
            try {
              await thread.setArchived(true);
            } catch {}
          }
        }

        if (raidMode.get(member.guild.id)) {
          await member.kick('Captcha non risolto (raid mode)').catch(() => {});
          await sendModLog(
            member.guild,
            modEmbed({
              title: 'Captcha',
              color: Colors.Red,
              description: `${member.user.tag} • non risolto → **kick** (raid mode)`,
            })
          );
        } else {
          await member.timeout(cfg.captcha.timeoutFailMs, 'Captcha non risolto').catch(() => {});
          await sendModLog(
            member.guild,
            modEmbed({
              title: 'Captcha',
              color: Colors.Red,
              description: `${member.user.tag} • non risolto → **timeout**`,
            })
          );
        }
      }
    }, cfg.captcha.timeToSolveMs + 1000);
  });

  // === Captcha handler: DM O thread privato
  client.on(Events.MessageCreate, async (msg) => {
    if (msg.author.bot) return;

    // DM
    if (!msg.guild) {
      const sess = captchaSessions.get(msg.author.id);
      if (!sess) return;
      if (Date.now() > sess.expiresAt) return;

      const answer = (msg.content || '').trim().toUpperCase();
      if (answer === sess.code) {
        captchaSessions.delete(msg.author.id);
        try {
          await msg.reply('✅ Verifica completata!');
        } catch {}
        const g = client.guilds.cache.get(sess.guildId);
        if (g)
          await sendModLog(
            g,
            modEmbed({
              title: 'Captcha',
              color: Colors.Green,
              description: `${msg.author.tag} • **verificato** (DM)`,
            })
          );
      } else {
        try {
          await msg.reply('❌ Codice errato. Riprova.');
        } catch {}
      }
      return;
    }

    // Thread privato di verifica
    const sess = captchaSessions.get(msg.author.id);
    if (!sess || !sess.threadId) return;
    if (msg.channelId !== sess.threadId) return;
    if (Date.now() > sess.expiresAt) return;

    const answer = (msg.content || '').trim().toUpperCase();
    if (answer === sess.code) {
      captchaSessions.delete(msg.author.id);
      try {
        await msg.reply('✅ Verifica completata!');
      } catch {}
      // chiudi il thread
      try {
        await msg.channel.setArchived(true);
      } catch {}
      await sendModLog(
        msg.guild,
        modEmbed({
          title: 'Captcha',
          color: Colors.Green,
          description: `${msg.author.tag} • **verificato** (thread)`,
        })
      );
    } else {
      try {
        await msg.reply('❌ Codice errato. Riprova.');
      } catch {}
    }
  });

  // === AntiScam / AntiFlood / AntiSpam
  client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;
    const cfg = getConfig(message.guild.id);
    if (!cfg.enabled) return;
    const member = message.member;
    if (isMod(member)) return;

    // AntiScam
    if (cfg.antiscam.enabled && message.content) {
      const lower = message.content.toLowerCase();
      if (suspiciousDomains.some((d) => lower.includes(d))) {
        await message.delete().catch(() => {});
        await member.timeout(cfg.antiscam.timeoutMs, 'AntiScam: link sospetto').catch(() => {});
        await sendModLog(
          message.guild,
          modEmbed({
            title: 'AntiScam',
            color: Colors.Yellow,
            description: `Utente: **${member.user.tag}**\nAzione: **timeout**\nCanale: <#${message.channel.id}>`,
          })
        );
        return;
      }
    }

    const key = `${message.guild.id}:${message.author.id}`;
    const t = now();

    // AntiFlood
    if (cfg.antiflood.enabled) {
      const arr = msgBuckets.get(key) ?? [];
      const next = [...arr.filter((ts) => ts >= t - cfg.antiflood.windowMs), t];
      msgBuckets.set(key, next);
      if (next.length > cfg.antiflood.maxMsgs) {
        await message.delete().catch(() => {});
        await member
          .timeout(cfg.antiflood.timeoutMs, 'AntiFlood: troppi messaggi ravvicinati')
          .catch(() => {});
        await sendModLog(
          message.guild,
          modEmbed({
            title: 'AntiFlood',
            color: Colors.Yellow,
            description: `Utente: **${member.user.tag}**\nAzione: **timeout**`,
          })
        );
        return;
      }
    }

    // AntiSpam (messaggi identici ripetuti)
    if (cfg.antispam.enabled && message.content) {
      const rKey = `rep:${message.guild.id}:${message.author.id}`;
      const repArr = repeatBuckets.get(rKey) ?? [];
      const content = message.content.trim();
      const nextRep = [
        ...repArr.filter((e) => e.ts >= t - cfg.antispam.windowMs),
        { ts: t, content },
      ];
      repeatBuckets.set(rKey, nextRep);
      const repeats = nextRep.filter((e) => e.content === content).length;

      if (repeats >= cfg.antispam.repeatTrigger) {
        await message.delete().catch(() => {});
        await member.timeout(cfg.antispam.timeoutMs, 'AntiSpam: messaggi ripetuti').catch(() => {});
        await sendModLog(
          message.guild,
          modEmbed({
            title: 'AntiSpam',
            color: Colors.Yellow,
            description: `Utente: **${member.user.tag}**\nAzione: **timeout**\nDettagli: ripetuti=${repeats}`,
          })
        );
        return;
      }
    }
  });

  // === AntiNuke (via audit logs)
  client.on(Events.ChannelDelete, async (channel) => {
    const g = channel.guild;
    const cfg = getConfig(g.id);
    if (!cfg.enabled || !cfg.antinuke.enabled) return;
    const entry = await g.fetchAuditLogs({ type: 12, limit: 1 }).catch(() => null); // CHANNEL_DELETE
    const execId = entry?.entries?.first()?.executorId;
    if (execId) await handleNuke(g, execId, 'channelDelete', cfg.antinuke);
  });

  client.on(Events.GuildRoleDelete, async (role) => {
    const g = role.guild;
    const cfg = getConfig(g.id);
    if (!cfg.enabled || !cfg.antinuke.enabled) return;
    const entry = await g.fetchAuditLogs({ type: 32, limit: 1 }).catch(() => null); // ROLE_DELETE
    const execId = entry?.entries?.first()?.executorId;
    if (execId) await handleNuke(g, execId, 'roleDelete', cfg.antinuke);
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const g = member.guild;
    const cfg = getConfig(g.id);
    if (!cfg.enabled || !cfg.antinuke.enabled) return;
    const entry = await g.fetchAuditLogs({ type: 20, limit: 1 }).catch(() => null); // MEMBER_KICK
    const e = entry?.entries?.first();
    if (e?.executorId && e?.targetId === member.id) {
      await handleNuke(g, e.executorId, 'memberKick', cfg.antinuke);
    }
  });
}

// ===== AntiNuke helper =====
async function handleNuke(guild, executorId, kind, conf) {
  const key = `${guild.id}:${executorId}`;
  const bucket =
    kind === 'channelDelete'
      ? nukeCounters.channelDelete
      : kind === 'roleDelete'
      ? nukeCounters.roleDelete
      : nukeCounters.memberKick;

  const t = now();
  const arr = bucket.get(key) ?? [];
  const next = [...arr.filter((ts) => ts >= t - conf.windowMs), t];
  bucket.set(key, next);

  const thr =
    kind === 'channelDelete'
      ? conf.channelDeletes
      : kind === 'roleDelete'
      ? conf.roleDeletes
      : conf.memberKicks;

  if (next.length >= thr) {
    try {
      const exec = await guild.members.fetch(executorId).catch(() => null);
      if (exec && !exec.user.bot) {
        await exec
          .timeout(conf.actionTimeoutMs, `AntiNuke: ${kind} x${next.length}`)
          .catch(() => {});
        await sendModLog(
          guild,
          modEmbed({
            title: 'AntiNuke',
            color: Colors.Red,
            description: `Esecutore: <@${executorId}>\nAzione: **timeout**\nMotivo: ${kind} x${next.length}`,
          })
        );
      }
    } catch {}
    bucket.set(key, []);
  }
}
