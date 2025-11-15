// commands/kick.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Espelle un utente dal server.')
  .addUserOption(opt =>
    opt
      .setName('utente')
      .setDescription('Utente da espellere')
      .setRequired(true),
  )
  .addStringOption(opt =>
    opt
      .setName('motivo')
      .setDescription('Motivo del kick')
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .setDMPermission(false);

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.',
      ephemeral: true,
    });
  }

  const target = interaction.options.getUser('utente', true);
  const reason = interaction.options.getString('motivo') || 'Nessun motivo fornito.';
  const moderator = interaction.user;

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);

  if (!member) {
    return interaction.reply({
      content: '❌ Utente non trovato nel server.',
      ephemeral: true,
    });
  }

  if (!member.kickable) {
    return interaction.reply({
      content: '❌ Non posso espellere questo utente. Controlla ruoli e permessi.',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const kickResult = await member.kick(`Kick da ${moderator.tag}: ${reason}`).catch(() => null);

  if (!kickResult) {
    return interaction.editReply('❌ Errore durante il kick. Verifica i permessi di Nimbus.');
  }

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({
      name: moderator.tag,
      iconURL: moderator.displayAvatarURL({ size: 128 }),
    })
    .setTitle('Kick')
    .setDescription(
      [
        '✅ Espulsione eseguita con successo.',
        '',
        `Utente: **${target.tag}** (\`${target.id}\`)`,
        `Motivo: **${reason}**`,
      ].join('\n'),
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
