// commands/inspect.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';

import { ensureGuild, getGuildSettings } from '../utils/settings.js';

// Prova a stimare quanti warn ha l'utente, senza rompere nulla
function getWarnCount(settings, userId) {
  try {
    if (!settings || !settings.warns) return 0;
    const entry = settings.warns[userId];

    if (!entry) return 0;

    if (Array.isArray(entry)) return entry.length;

    if (typeof entry === 'object') {
      return Object.values(entry).length;
    }

    return 0;
  } catch {
    return 0;
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatRelative(days) {
  if (days < 1) return 'meno di 1 giorno fa';
  if (days < 7) return `circa ${Math.round(days)} giorni fa`;
  const weeks = days / 7;
  if (weeks < 4) return `circa ${Math.round(weeks)} settimane fa`;
  const months = days / 30;
  if (months < 12) return `circa ${Math.round(months)} mesi fa`;
  const years = days / 365;
  return `circa ${years.toFixed(1)} anni fa`;
}

export const data = new SlashCommandBuilder()
  .setName('inspect')
  .setDescription('Analizza un utente e segnala possibili rischi.')
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .setDMPermission(false)
  .addUserOption(opt =>
    opt
      .setName('utente')
      .setDescription('Utente da ispezionare.')
      .setRequired(true),
  );

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.',
      ephemeral: true,
    });
  }

  const targetUser = interaction.options.getUser('utente', true);
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    return interaction.reply({
      content: '❌ Non riesco a trovare questo utente nel server.',
      ephemeral: true,
    });
  }

  const guildId = interaction.guild.id;
  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);

  // === DATI BASE ===
  const now = Date.now();

  const accountCreated = targetUser.createdAt;
  const accountDays = (now - accountCreated.getTime()) / (1000 * 60 * 60 * 24);

  const joinedAt = member.joinedAt ?? null;
  const joinedDays = joinedAt
    ? (now - joinedAt.getTime()) / (1000 * 60 * 60 * 24)
    : null;

  const roles = member.roles.cache
    .filter(r => r.id !== interaction.guild.id)
    .sort((a, b) => b.position - a.position);

  const highestRole = roles.first() ?? null;
  const warnCount = getWarnCount(settings, targetUser.id);

  // === HEURISTICHE RISCHIO ===
  const riskFlags = [];

  if (accountDays < 3) {
    riskFlags.push('🧨 Account creato meno di 3 giorni fa');
  } else if (accountDays < 7) {
    riskFlags.push('⚠️ Account molto recente (meno di 7 giorni)');
  }

  if (joinedDays !== null && joinedDays < 1) {
    riskFlags.push('📥 È entrato nel server da meno di 24 ore');
  }

  if (!highestRole) {
    riskFlags.push('👤 Nessun ruolo assegnato (solo @everyone)');
  }

  if (warnCount > 0) {
    riskFlags.push(`📌 Ha già \`${warnCount}\` warn registrati`);
  }

  const susWords = ['discord.gg', 'nitro', 'gratis', 'free', 'gift', 'steam', 'http', 'www'];
  const nameText = [
    targetUser.username ?? '',
    targetUser.globalName ?? '',
    member.nickname ?? '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (susWords.some(w => nameText.includes(w))) {
    riskFlags.push('🔗 Username/nickname contiene link o parole sospette (nitro, discord.gg, ecc.)');
  }

  const riskLevel = (() => {
    const count = riskFlags.length;
    if (count === 0) return 'Basso';
    if (count <= 2) return 'Moderato';
    if (count <= 4) return 'Alto';
    return 'Molto alto';
  })();

  // === EMBED ===
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: `${targetUser.tag}`,
      iconURL: targetUser.displayAvatarURL({ size: 128 }),
    })
    .setTitle('Ispezione utente')
    .addFields(
      {
        name: '📇 Info account',
        value: [
          `• ID: \`${targetUser.id}\``,
          `• Creato il: \`${formatDate(accountCreated)}\``,
          `• Età account: \`${formatRelative(accountDays)}\``,
        ].join('\n'),
        inline: false,
      },
      {
        name: '🏠 Info server',
        value: [
          joinedAt
            ? `• Entrato il: \`${formatDate(joinedAt)}\``
            : '• Entrato il: `dati non disponibili`',
          joinedAt
            ? `• Presente nel server da: \`${formatRelative(joinedDays)}\``
            : '',
          `• Ruoli: \`${roles.size}\``,
          highestRole
            ? `• Ruolo più alto: ${highestRole} (\`${highestRole.name}\`)`
            : '• Ruolo più alto: `@everyone`',
        ]
          .filter(Boolean)
          .join('\n'),
        inline: false,
      },
      {
        name: '⚖️ Moderation',
        value: `• Warn registrati: \`${warnCount}\``,
        inline: false,
      },
      {
        name: '🛡️ Valutazione rischio',
        value:
          riskFlags.length > 0
            ? [
                `**Livello:** \`${riskLevel}\``,
                '',
                riskFlags.map(f => `• ${f}`).join('\n'),
              ].join('\n')
            : '`Nessun indicatore critico rilevato.`',
        inline: false,
      },
    )
    .setFooter({
      text: `Richiesto da ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL({ size: 64 }) ?? undefined,
    })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    ephemeral: true, // solo lo staff che usa il comando lo vede
  });
}
