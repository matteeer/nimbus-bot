// commands/clear.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Cancella un numero di messaggi nel canale corrente.')
  .addIntegerOption(opt =>
    opt
      .setName('quantità')
      .setDescription('Numero di messaggi da rimuovere (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setDMPermission(false);

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.',
      ephemeral: true,
    });
  }

  const amount = interaction.options.getInteger('quantità', true);
  const moderator = interaction.user;
  const channel = interaction.channel;

  if (!channel?.isTextBased()) {
    return interaction.reply({
      content: '❌ Questo comando funziona solo nei canali testuali.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const deleted = await channel.bulkDelete(amount, true).catch(() => null);

  if (!deleted) {
    return interaction.editReply('❌ Errore durante l’eliminazione dei messaggi (forse troppo vecchi).');
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: moderator.tag,
      iconURL: moderator.displayAvatarURL({ size: 128 }),
    })
    .setTitle('Clear')
    .setDescription(
      [
        '✅ Operazione completata.',
        '',
        `Messaggi rimossi: **${deleted.size}**`,
        `Canale: ${channel}`,
      ].join('\n'),
    )
    .setTimestamp();

  // messaggio pubblico nel canale
  await channel.send({ embeds: [embed] }).catch(() => {});

  await interaction.editReply('✅ Pulizia completata.');
}

