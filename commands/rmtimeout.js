// commands/removetimeout.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('removetimeout')
  .setDescription('Rimuove il timeout a un utente.')
  .addUserOption(opt =>
    opt.setName('utente').setDescription('Utente a cui rimuovere il timeout').setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('motivo').setDescription('Motivo della rimozione').setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando funziona solo nei server.',
      ephemeral: true
    });
  }

  const target = interaction.options.getUser('utente', true);
  const reason = interaction.options.getString('motivo') || 'Nessun motivo fornito.';
  const moderator = interaction.user;

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);

  if (!member) {
    return interaction.reply({
      content: '❌ Utente non trovato.',
      ephemeral: true
    });
  }

  if (!member.isCommunicationDisabled()) {
    return interaction.reply({
      content: '❌ Questo utente non è in timeout.',
      ephemeral: true
    });
  }

  if (!member.moderatable) {
    return interaction.reply({
      content: '❌ Non posso rimuovere il timeout. Controlla i permessi.',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const ok = await member.timeout(null, `Timeout rimosso da ${moderator.tag}: ${reason}`).catch(() => null);

  if (!ok) {
    return interaction.editReply('❌ Errore durante la rimozione del timeout.');
  }

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setAuthor({
      name: moderator.tag,
      iconURL: moderator.displayAvatarURL({ size: 128 })
    })
    .setTitle('/removetimeout')
    .setDescription(
      [
        '✅ Timeout rimosso.',
        '',
        `Utente: **${target.tag}** (\`${target.id}\`)`,
        `Motivo: **${reason}**`
      ].join('\n')
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
