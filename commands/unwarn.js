// commands/unwarn.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nEmbed } from '../utils/ui.js';
import { removeWarn, getWarns } from '../utils/warns.js';

export const data = new SlashCommandBuilder()
  .setName('unwarn').setDescription('Rimuovi un warning da un utente')
  .addUserOption(o=>o.setName('utente').setDescription('Utente').setRequired(true))
  .addIntegerOption(o=>o.setName('numero').setDescription('Indice del warn (1 = più vecchio)').setRequired(true).setMinValue(1))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction){
  const u = interaction.options.getUser('utente', true);
  const idx = interaction.options.getInteger('numero', true);
  await interaction.deferReply({ ephemeral:true });

  const removed = removeWarn(interaction.guild.id, u.id, idx);
  if (!removed) {
    const arr = getWarns(interaction.guild.id, u.id);
    return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Unwarn', description:`❌ Indice non valido. Questo utente ha **${arr.length}** warn.` })] });
  }
  return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Unwarn', description:`✅ Rimosso warn #${idx} da **${u.tag}**.` })] });
}

