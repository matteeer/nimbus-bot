// commands/setup.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';

import { ensureGuild, getGuildSettings } from '../utils/settings.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configura Nimbus nel server (log e canali di servizio).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)

// /setup log
  .addSubcommand(sub =>
    sub
      .setName('log')
      .setDescription('Imposta il canale dei log moderazione/sistema.')
      .addChannelOption(opt =>
        opt
          .setName('canale')
          .setDescription('Canale log')
          .setRequired(true),
      ),
  )

// /setup channels
  .addSubcommand(sub =>
    sub
      .setName('channels')
      .setDescription('Imposta i canali di servizio (tickets/reports).')
      .addChannelOption(opt =>
        opt
          .setName('tickets')
          .setDescription('Canale per il pannello ticket / apertura ticket')
          .setRequired(false),
      )
      .addChannelOption(opt =>
        opt
          .setName('reports')
          .setDescription('Canale per le segnalazioni utenti')
          .setRequired(false),
      ),
  )

// /setup reset
  .addSubcommand(sub =>
    sub
      .setName('reset')
      .setDescription('Resetta la configurazione base di Nimbus (log e canali servizio).'),
  );

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.',
      ephemeral: true,
    });
  }

  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;

  ensureGuild(guildId);
  const settings = getGuildSettings(guildId);
  if (!settings.channels) settings.channels = {};

  await interaction.deferReply({ ephemeral: true });

  try {
    // /setup log
    if (sub === 'log') {
      const channel = interaction.options.getChannel('canale', true);

      if (!channel.isTextBased()) {
        return interaction.editReply({
          content: '❌ Il canale log deve essere un canale testuale.',
        });
      }

      settings.logChannelId = channel.id;

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('Setup • Log')
        .setDescription(`Canale log impostato su ${channel}.`)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // /setup channels
    if (sub === 'channels') {
      const tickets = interaction.options.getChannel('tickets');
      const reports = interaction.options.getChannel('reports');

      if (!tickets && !reports) {
        return interaction.editReply({
          content: '❌ Specifica almeno un canale (`tickets` o `reports`).',
        });
      }

      if (tickets && !tickets.isTextBased()) {
        return interaction.editReply({
          content: '❌ Il canale tickets deve essere testuale.',
        });
      }

      if (reports && !reports.isTextBased()) {
        return interaction.editReply({
          content: '❌ Il canale reports deve essere testuale.',
        });
      }

      if (tickets) settings.channels.ticketsChannelId = tickets.id;
      if (reports) settings.channels.reportsChannelId = reports.id;

      const lines = [];
      if (tickets) lines.push(`• Tickets: ${tickets}`);
      if (reports) lines.push(`• Reports: ${reports}`);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('Setup • Canali')
        .setDescription(lines.join('\n'))
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // /setup reset
    if (sub === 'reset') {
      settings.logChannelId = null;
      settings.channels.ticketsChannelId = null;
      settings.channels.reportsChannelId = null;

      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('Setup • Reset')
        .setDescription('Configurazione base di Nimbus (log e canali servizio) è stata resettata.')
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    console.error('setup error:', err);
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({
        content: '❌ Errore durante la configurazione.',
        ephemeral: true,
      });
    }
    await interaction.editReply({
      content: '❌ Errore durante la configurazione.',
    }).catch(() => {});
  }
}
