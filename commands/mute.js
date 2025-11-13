// commands/mute.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nEmbed } from '../utils/ui.js';

function parseMs(str){
  const m = str?.match(/^(\d+)(s|m|h|d)$/i);
  if (!m) return null;
  const n = parseInt(m[1],10); const u=m[2].toLowerCase();
  return u==='s'? n*1000 : u==='m'? n*60*1000 : u==='h'? n*60*60*1000 : n*24*60*60*1000;
}

export const data = new SlashCommandBuilder()
  .setName('mute').setDescription('Timeout di un utente')
  .addUserOption(o=>o.setName('utente').setDescription('Utente').setRequired(true))
  .addStringOption(o=>o.setName('tempo').setDescription('Es: 10m, 1h, 1d').setRequired(true))
  .addStringOption(o=>o.setName('motivo').setDescription('Motivo').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction){
  const target = interaction.options.getUser('utente', true);
  const timeStr= interaction.options.getString('tempo', true);
  const ms = parseMs(timeStr);
  const reason = interaction.options.getString('motivo') || '—';
  await interaction.deferReply({ ephemeral:true });

  if (!ms) return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Mute', description:'❌ Formato tempo non valido. Usa es: `10m`, `1h`, `1d`.' })] });

  const member = await interaction.guild.members.fetch(target.id).catch(()=>null);
  if (!member) return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Mute', description:'❌ Utente non trovato nel server.' })] });

  await member.timeout(ms, reason).catch(()=>null);
  return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Mute', description:`✅ ${target.tag} in timeout per **${timeStr}**.\n\nMotivo: ${reason}` })] });
}
