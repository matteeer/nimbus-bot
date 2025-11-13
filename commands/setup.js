// commands/setup.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { ensureGuild, getGuildSettings, setGuildSettings } from '../utils/settings.js';
import { nEmbed } from '../utils/ui.js';

const MODULES = ['global','antispam','antiflood','antiscam','antiraid','captcha','antinuke'];

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configura Nimbus nel server (log, canali, automod).')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sc =>
    sc.setName('setlog')
      .setDescription('Imposta il canale dei log moderazione/sistema')
      .addChannelOption(o =>
        o.setName('channel')
         .setDescription('Canale log')
         .addChannelTypes(ChannelType.GuildText)
         .setRequired(true)
      )
  )
  .addSubcommand(sc =>
    sc.setName('setchannel')
      .setDescription('Imposta i canali di servizio (tickets/reports)')
      .addStringOption(o =>
        o.setName('type')
         .setDescription('Tipo canale')
         .addChoices(
           { name: 'tickets', value: 'tickets' },
           { name: 'reports', value: 'reports' },
         )
         .setRequired(true)
      )
      .addChannelOption(o =>
        o.setName('channel')
         .setDescription('Canale di destinazione')
         .addChannelTypes(ChannelType.GuildText)
         .setRequired(true)
      )
  )
  .addSubcommand(sc =>
    sc.setName('automod')
      .setDescription('Attiva/Disattiva un modulo AutoMod')
      .addStringOption(o =>
        o.setName('module')
         .setDescription('Modulo')
         .addChoices(...MODULES.map(m => ({ name: m, value: m })))
         .setRequired(true)
      )
      .addBooleanOption(o =>
        o.setName('enabled')
         .setDescription('ON/OFF')
         .setRequired(true)
      )
  )
  .setDMPermission(false);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.inGuild()) {
    return interaction.editReply({
      embeds: [nEmbed(interaction.client, { title: 'Setup', description: '❌ Usa questo comando dentro un server.' })],
    });
  }

  ensureGuild(interaction.guild.id);
  const sub = interaction.options.getSubcommand();

  // /setup setlog
  if (sub === 'setlog') {
    const channel = interaction.options.getChannel('channel', true);
    setGuildSettings(interaction.guild.id, { modLogChannelId: channel.id });
    return interaction.editReply({
      embeds: [nEmbed(interaction.client, { title: 'Setup', description: `✅ Canale **log** impostato su ${channel}.` })],
    });
  }

  // /setup setchannel
  if (sub === 'setchannel') {
    const type = interaction.options.getString('type', true);
    const channel = interaction.options.getChannel('channel', true);

    const key =
      type === 'tickets' ? 'ticketsChannelId' :
                           'userReportsChannelId';

    const curr = getGuildSettings(interaction.guild.id) || {};
    setGuildSettings(interaction.guild.id, { ...curr, [key]: channel.id });

    return interaction.editReply({
      embeds: [nEmbed(interaction.client, { title: 'Setup', description: `✅ Canale **${type}** → ${channel}` })],
    });
  }

  // /setup toggle
  if (sub === 'automod') {
    const module = interaction.options.getString('module', true);
    const enabled = interaction.options.getBoolean('enabled', true);

    const settings = getGuildSettings(interaction.guild.id) || {};
    const automod = settings.automod || { enabled: true };

    if (module === 'global') {
      automod.enabled = enabled;
    } else {
      automod[module] = automod[module] || {};
      automod[module].enabled = enabled;
    }

    setGuildSettings(interaction.guild.id, { ...settings, automod });

    return interaction.editReply({
      embeds: [nEmbed(interaction.client, { title: 'AutoMod', description: `✅ **${module}** → **${enabled ? 'ON' : 'OFF'}**` })],
    });
  }

  return interaction.editReply({
    embeds: [nEmbed(interaction.client, { title: 'Setup', description: '❌ Sottocomando non riconosciuto.' })],
  });
}
