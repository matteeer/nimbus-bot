// commands/clear.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nEmbed } from '../utils/ui.js';

export const data = new SlashCommandBuilder()
  .setName('clear').setDescription('Cancella un numero di messaggi nel canale')
  .addIntegerOption(o=>o.setName('numero').setDescription('Da 1 a 100').setMinValue(1).setMaxValue(100).setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setDMPermission(false);

export async function execute(interaction) {
  const n = interaction.options.getInteger('numero', true);
  const ch = interaction.channel;
  await interaction.deferReply({ ephemeral:true });
  if (!ch.isTextBased()) return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Clear', description:'❌ Usa questo comando in un canale di testo.' })] });

  const deleted = await ch.bulkDelete(n, true).catch(()=>null);
  if (!deleted) return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Clear', description:'❌ Non sono riuscito a cancellare (messaggi troppo vecchi o permessi mancanti).' })] });

  return interaction.editReply({ embeds:[nEmbed(interaction.client,{ title:'Clear', description:`✅ Eliminati **${deleted.size}** messaggi.` })] });
}

