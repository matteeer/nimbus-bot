// commands/clearwarns.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nEmbed } from '../utils/ui.js';
import { clearWarns } from '../utils/warns.js';

export const data = new SlashCommandBuilder()
  .setName('clearwarns').setDescription('Cancella tutti i warning di un utente')
  .addUserOption(o=>o.setName('utente').setDescription('Utente').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction){
  const u = interaction.options.getUser('utente', true);
  await interaction.deferReply({ ephemeral:true });
  clearWarns(interaction.guild.id, u.id);
  return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Clear Warns', description:`✅ Puliti tutti i warning di **${u.tag}**.` })] });
}
