// commands/lock.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Blocca il canale corrente per @everyone.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false);

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.'
    });
  }

  const channel = interaction.channel;
  const everyone = interaction.guild.roles.everyone;
  const moderator = interaction.user;

  if (!channel?.isTextBased()) {
    return interaction.reply({
      content: '❌ Questo comando funziona solo nei canali testuali.'
    });
  }

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
      content: '❌ Non hai i permessi per bloccare questo canale.'
    });
  }

  try {
    await channel.permissionOverwrites.edit(everyone, { SendMessages: false });
  } catch (err) {
    console.error('lock error:', err);
    return interaction.reply({
      content: '❌ Non sono riuscito a bloccare il canale. Controlla i permessi di Nimbus.'
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({
      name: moderator.tag,
      iconURL: moderator.displayAvatarURL({ size: 128 })
    })
    .setTitle('Lock')
    .setDescription(
      [
        '✅ Canale bloccato.',
        '',
        `Canale: ${channel}`,
        'I messaggi sono disabilitati per `@everyone`.'
      ].join('\n')
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`NIMBUS_LOCK_UNLOCK:${channel.id}`)
      .setLabel('Sblocca canale')
      .setStyle(ButtonStyle.Secondary)
  );

  // unica risposta: embed pubblica + bottone
  await interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

// handler bottone unlock
export async function handleLockButton(interaction) {
  if (!interaction.inGuild()) return;

  const id = interaction.customId;
  if (!id.startsWith('NIMBUS_LOCK_UNLOCK:')) return;

  const moderator = interaction.user;

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
      content: '❌ Non hai i permessi per sbloccare questo canale.'
    });
  }

  const channelId = id.split(':')[1];
  const channel =
    interaction.guild.channels.cache.get(channelId) ??
    (await interaction.guild.channels.fetch(channelId).catch(() => null));

  if (!channel?.isTextBased()) {
    return interaction.reply({
      content: '❌ Canale non trovato o non valido.'
    });
  }

  try {
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null
    });

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setAuthor({
        name: moderator.tag,
        iconURL: moderator.displayAvatarURL({ size: 128 })
      })
      .setTitle('Lock')
      .setDescription(
        [
          '✅ Canale sbloccato.',
          '',
          `Canale: ${channel}`,
          'I permessi di invio messaggi sono stati ripristinati.'
        ].join('\n')
      )
      .setTimestamp();

    // aggiorno il messaggio originale, senza più bottone
    await interaction.update({
      embeds: [embed],
      components: []
    });
  } catch (err) {
    console.error('unlock error:', err);
    return interaction.reply({
      content: '❌ Errore nello sbloccare il canale. Controlla i permessi di Nimbus.'
    });
  }
}
