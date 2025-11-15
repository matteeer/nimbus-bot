// commands/ban.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Banna un utente dal server.')
  .addUserOption(opt =>
    opt
      .setName('utente')
      .setDescription('Utente da bannare')
      .setRequired(true),
  )
  .addStringOption(opt =>
    opt
      .setName('motivo')
      .setDescription('Motivo del ban')
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
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

  if (!member.bannable) {
    return interaction.reply({
      content: '❌ Non posso bannare questo utente. Controlla ruoli e permessi.',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  // Prova a notificare in DM, ma se fallisce andiamo avanti
  const dmMsg =
    `Sei stato bannato da **${interaction.guild.name}**.\n` +
    `Motivo: ${reason}`;
  await target.send(dmMsg).catch(() => {});

  const banResult = await member.ban({ reason: `Ban da ${moderator.tag}: ${reason}` }).catch(() => null);

  if (!banResult) {
    return interaction.editReply('❌ Errore durante il ban. Verifica i permessi di Nimbus.');
  }

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({
      name: moderator.tag,
      iconURL: moderator.displayAvatarURL({ size: 128 }),
    })
    .setTitle('Ban')
    .setDescription(
      [
        '✅ Ban eseguito con successo.',
        '',
        `Utente: **${target.tag}** (\`${target.id}\`)`,
        `Motivo: **${reason}**`,
      ].join('\n'),
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
