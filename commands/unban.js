// commands/unban.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nEmbed } from '../utils/ui.js';

export const data = new SlashCommandBuilder()
  .setName('unban').setDescription('Sbanna un utente')
  .addStringOption(o=>o.setName('id').setDescription('ID utente').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .setDMPermission(false);

export async function execute(interaction){
  const id = interaction.options.getString('id', true);
  await interaction.deferReply({ ephemeral:true });

  try {
    await interaction.guild.members.unban(id, reason);
    return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Unban', description:`✅ Utente \`${id}\` sbannato.` })] });
  } catch {
    return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Unban', description:'❌ Non sono riuscito a sbananre quell’ID.' })] });
  }
}
