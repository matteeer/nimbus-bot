// commands/kick.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nEmbed } from '../utils/ui.js';

export const data = new SlashCommandBuilder()
  .setName('kick').setDescription('Espelli un utente')
  .addUserOption(o=>o.setName('utente').setDescription('Utente').setRequired(true))
  .addStringOption(o=>o.setName('motivo').setDescription('Motivo').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .setDMPermission(false);

export async function execute(interaction){
  const target = interaction.options.getUser('utente', true);
  const reason = interaction.options.getString('motivo') || '—';
  await interaction.deferReply({ ephemeral:true });

  const member = await interaction.guild.members.fetch(target.id).catch(()=>null);
  if (!member) return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Kick', description:'❌ Utente non trovato nel server.' })] });
  if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers))
    return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Kick', description:'❌ Non hai i permessi per farlo.' })] });

  await member.kick(reason).catch(()=>null);
  return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Kick', description:`✅ ${target.tag} espulso.\n\nMotivo: ${reason}` })] });
}
