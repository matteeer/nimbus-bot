// commands/ban.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nEmbed } from '../utils/ui.js';

export const data = new SlashCommandBuilder()
  .setName('ban').setDescription('Banna un utente')
  .addUserOption(o=>o.setName('utente').setDescription('Utente').setRequired(true))
  .addStringOption(o=>o.setName('motivo').setDescription('Motivo').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .setDMPermission(false);

export async function execute(interaction){
  const target = interaction.options.getUser('utente', true);
  const reason = interaction.options.getString('motivo') || '—';
  await interaction.deferReply({ ephemeral:true });

  const member = await interaction.guild.members.fetch(target.id).catch(()=>null);
  if (!member) return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Ban', description:'❌ Utente non trovato nel server.' })] });
  if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
    return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Ban', description:'❌ Non hai i permessi per farlo.' })] });

  await member.ban({ reason }).catch(()=>null);
  return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Ban', description:`✅ ${target.tag} bannato.\n\nMotivo: ${reason}` })] });
}

