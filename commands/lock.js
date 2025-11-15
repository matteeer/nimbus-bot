// commands/lock.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Blocca il canale corrente per @everyone')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false);

// /lock
export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.',
      ephemeral: true,
    });
  }

  const channel = interaction.channel;
  if (!channel?.isTextBased()) {
    return interaction.reply({
      content: '❌ Questo comando funziona solo nei canali testuali.',
      ephemeral: true,
    });
  }

  const everyone = interaction.guild.roles.everyone;

  // ci mettiamo al sicuro da timeout → prima defer, poi tutto il resto
  await interaction.deferReply({ ephemeral: true });

  try {
    // blocca invio messaggi a everyone
    await channel.permissionOverwrites.edit(everyone, {
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setAuthor({ name: 'Nimbus • Lock' })
      .setDescription(
        `🔒 Il canale ${channel} è stato **bloccato** per \`@everyone\`.\n\n` +
        'Un moderatore può usare il bottone qui sotto per **sbloccarlo**.'
      )
      .setFooter({ text: 'Nimbus • /lock' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`NIMBUS_LOCK_UNLOCK:${channel.id}`)
        .setLabel('Sblocca canale')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔓'),
    );

    // messaggio pubblico nel canale
    await channel.send({
      embeds: [embed],
      components: [row],
    });

    // conferma SOLO a chi ha usato /lock (ephemeral)
    await interaction.editReply({
      content: `🔒 Canale ${channel} bloccato per \`@everyone\`.`,
    });
  } catch (err) {
    console.error('lock error:', err);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content: '❌ Non sono riuscito a bloccare il canale. Controlla i permessi di Nimbus.',
      }).catch(() => {});
    }
  }
}

// bottone "Sblocca canale"
export async function handleLockButton(interaction) {
  if (!interaction.inGuild()) return;

  const id = interaction.customId;
  if (!id.startsWith('NIMBUS_LOCK_UNLOCK:')) return;

  const parts = id.split(':');
  const channelId = parts[1];

  // solo chi ha ManageChannels può sbloccare
  const member = interaction.member;
  if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
      content: '❌ Non hai i permessi per sbloccare questo canale.',
      ephemeral: true,
    });
  }

  const channel =
    interaction.guild.channels.cache.get(channelId) ??
    (await interaction.guild.channels.fetch(channelId).catch(() => null));

  if (!channel?.isTextBased()) {
    return interaction.reply({
      content: '❌ Canale non trovato o non valido.',
      ephemeral: true,
    });
  }

  const everyone = interaction.guild.roles.everyone;

  await interaction.deferReply({ ephemeral: true });

  try {
    // resetta il permesso, torna al default
    await channel.permissionOverwrites.edit(everyone, {
      SendMessages: null,
    });

    await interaction.editReply({
      content: `✅ Il canale ${channel} è stato **sbloccato** per \`@everyone\`.`,
    });
  } catch (err) {
    console.error('unlock error:', err);
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content: '❌ Non sono riuscito a sbloccare il canale. Controlla i permessi di Nimbus.',
      }).catch(() => {});
    }
  }
}

