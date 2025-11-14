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

  try {
    await channel.permissionOverwrites.edit(everyone, {
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setAuthor({ name: 'Nimbus • Lock' })
      .setDescription(
        `🔒 Il canale ${channel} è stato **bloccato** per \`@everyone\`.\n\n` +
        'Usa il bottone qui sotto per sbloccarlo.'
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

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  } catch (err) {
    console.error('lock error:', err);
    await interaction.reply({
      content: '❌ Non sono riuscito a bloccare il canale. Controlla i permessi di Nimbus.',
      ephemeral: true,
    });
  }
}

// Handler per il bottone di unlock
export async function handleLockButton(interaction) {
  if (!interaction.inGuild()) return;

  const id = interaction.customId;
  if (!id.startsWith('NIMBUS_LOCK_UNLOCK:')) return;

  const parts = id.split(':');
  const channelId = parts[1];

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

  try {
    await channel.permissionOverwrites.edit(everyone, {
      SendMessages: null, // reset al default
    });

    // Proviamo ad aggiornare il messaggio (non è obbligatorio)
    try {
      const embed = EmbedBuilder.from(interaction.message.embeds[0] ?? {})
        .setColor(0x57f287)
        .setDescription(
          `🔓 Il canale ${channel} è stato **sbloccato** per \`@everyone\`.`
        );

      await interaction.message.edit({ embeds: [embed], components: [] }).catch(() => {});
    } catch {
      // se fallisce l'edit, ignoriamo
    }

    await interaction.reply({
      content: '✅ Canale sbloccato.',
      ephemeral: true,
    });
  } catch (err) {
    console.error('unlock error:', err);
    await interaction.reply({
      content: '❌ Non sono riuscito a sbloccare il canale. Controlla i permessi di Nimbus.',
      ephemeral: true,
    });
  }
}
