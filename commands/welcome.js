// commands/welcome.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';

import { ensureGuild, getGuildSettings } from '../utils/settings.js';

export const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Configura i messaggi di benvenuto.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand(sub =>
    sub
      .setName('config')
      .setDescription('Imposta il canale e le opzioni di benvenuto.')
      .addChannelOption(opt =>
        opt
          .setName('canale')
          .setDescription('Canale in cui inviare il messaggio di benvenuto')
          .setRequired(true),
      )
      .addBooleanOption(opt =>
        opt
          .setName('ping_utente')
          .setDescription('Menzionare direttamente l’utente? (default: sì)')
          .setRequired(false),
      )
      .addBooleanOption(opt =>
        opt
          .setName('embed')
          .setDescription('Usare un embed invece del messaggio semplice? (default: sì)')
          .setRequired(false),
      ),
  )
  .addSubcommand(sub =>
    sub
      .setName('preview')
      .setDescription('Mostra un esempio di messaggio di benvenuto.'),
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
  if (!settings.welcome) settings.welcome = {};

  if (sub === 'config') {
    const channel = interaction.options.getChannel('canale', true);
    const pingUser = interaction.options.getBoolean('ping_utente') ?? true;
    const useEmbed = interaction.options.getBoolean('embed') ?? true;

    if (!channel.isTextBased()) {
      return interaction.reply({
        content: '❌ Il canale deve essere testuale.',
        ephemeral: true,
      });
    }

    settings.welcome.enabled = true;
    settings.welcome.channelId = channel.id;
    settings.welcome.pingUser = pingUser;
    settings.welcome.embed = useEmbed;

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('Welcome configurato')
      .setDescription(
        [
          `• Canale: ${channel}`,
          `• Ping utente: \`${pingUser ? 'sì' : 'no'}\``,
          `• Embed: \`${useEmbed ? 'sì' : 'no'}\``,
        ].join('\n'),
      )
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }

  if (sub === 'preview') {
    const w = settings.welcome;
    if (!w || !w.enabled || !w.channelId) {
      return interaction.reply({
        content: '❌ Nessuna configurazione welcome trovata. Usa `/welcome config` prima.',
        ephemeral: true,
      });
    }

    const channel = interaction.guild.channels.cache.get(w.channelId);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: '❌ Il canale configurato non esiste più o non è testuale.',
        ephemeral: true,
      });
    }

    const fakeUser = interaction.user;
    const mention = w.pingUser ? fakeUser.toString() : `**${fakeUser.tag}**`;

    if (w.embed) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Benvenuto!')
        .setDescription(`${mention} è entrato in **${interaction.guild.name}** 🎉`)
        .setThumbnail(fakeUser.displayAvatarURL({ size: 256 }))
        .setTimestamp();

      await channel.send({
        content: w.pingUser ? mention : null,
        embeds: [embed],
        allowedMentions: w.pingUser ? { users: [fakeUser.id] } : { parse: [] },
      });
    } else {
      await channel.send({
        content: `Benvenuto ${mention} in **${interaction.guild.name}** 🎉`,
        allowedMentions: w.pingUser ? { users: [fakeUser.id] } : { parse: [] },
      });
    }

    return interaction.reply({
      content: `✅ Anteprima inviata in ${channel}.`,
      ephemeral: true,
    });
  }
}
