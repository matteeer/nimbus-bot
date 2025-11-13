// commands/warn.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nEmbed } from '../utils/ui.js';
import { addWarn } from '../utils/warns.js';

export const data = new SlashCommandBuilder()
  .setName('warn').setDescription('Aggiungi un warning a un utente')
  .addUserOption(o=>o.setName('utente').setDescription('Utente').setRequired(true))
  .addStringOption(o=>o.setName('motivo').setDescription('Motivo').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction){
  const u = interaction.options.getUser('utente', true);
  const reason = interaction.options.getString('motivo', true);
  await interaction.deferReply({ ephemeral:true });

  const arr = addWarn(interaction.guild.id, u.id, interaction.user.id, reason);
  return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Warn', description:`✅ Warning aggiunto a **${u.tag}**.\n\nMotivo: ${reason}\nWarn totali: **${arr.length}**` })] });
}

