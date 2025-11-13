// commands/unmute.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nEmbed } from '../utils/ui.js';

export const data = new SlashCommandBuilder()
  .setName('unmute').setDescription('Rimuovi il timeout a un utente')
  .addUserOption(o=>o.setName('utente').setDescription('Utente').setRequired(true))
  .addStringOption(o=>o.setName('motivo').setDescription('Motivo').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction){
  const target = interaction.options.getUser('utente', true);
  const reason = interaction.options.getString('motivo') || '—';
  await interaction.deferReply({ ephemeral:true });

  const member = await interaction.guild.members.fetch(target.id).catch(()=>null);
  if (!member) return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Unmute', description:'❌ Utente non trovato nel server.' })] });

  await member.timeout(null, reason).catch(()=>null);
  return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Unmute', description:`✅ Timeout rimosso a ${target.tag}.` })] });
}
