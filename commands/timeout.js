// commands/timeout.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('Applica un timeout a un utente.')
  .addUserOption(opt =>
    opt.setName('utente').setDescription('Utente da mettere in timeout').setRequired(true)
  )
  .addIntegerOption(opt =>
    opt.setName('minuti').setDescription('Durata del timeout in minuti').setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('motivo').setDescription('Motivo del timeout').setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.',
      ephemeral: true
    });
  }

  const target = interaction.options.getUser('utente', true);
  const minutes = interaction.options.getInteger('minuti', true);
  const reason = interaction.options.getString('motivo') || 'Nessun motivo fornito.';
  const moderator = interaction.user;

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);

  if (!member) {
    return interaction.reply({
      content: '❌ Impossibile trovare questo utente nel server.',
      ephemeral: true
    });
  }

  if (!member.moderatable) {
    return interaction.reply({
      content: '❌ Non posso mettere in timeout questo utente. Controlla ruoli e permessi.',
      ephemeral: true
    });
  }

  const ms = minutes * 60 * 1000;

  await interaction.deferReply();

  const ok = await member.timeout(ms, `Timeout da ${moderator.tag}: ${reason}`).catch(() => null);

  if (!ok) {
    return interaction.editReply('❌ Errore durante il timeout.');
  }

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({
      name: moderator.tag,
      iconURL: moderator.displayAvatarURL({ size: 128 })
    })
    .setTitle('Timeout')
    .setDescription(
      [
        '✅ Timeout applicato.',
        '',
        `Utente: **${target.tag}** (\`${target.id}\`)`,
        `Durata: **${minutes} min**`,
        `Motivo: **${reason}**`
      ].join('\n')
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
