// commands/reportuser.js
import { SlashCommandBuilder } from 'discord.js';
import { getGuildSettings } from '../utils/settings.js';
import { nEmbed, kv } from '../utils/ui.js';

export const data = new SlashCommandBuilder()
  .setName('reportuser')
  .setDescription('Segnala un utente allo staff')
  .addUserOption(o=>o.setName('utente').setDescription('Utente da segnalare').setRequired(true))
  .addStringOption(o=>o.setName('motivo').setDescription('Motivo della segnalazione').setRequired(true))
  .addAttachmentOption(o=>o.setName('prova').setDescription('Screenshot o file (opzionale)'))
  .setDMPermission(false);

export async function execute(interaction) {
  const target = interaction.options.getUser('utente', true);
  const reason = interaction.options.getString('motivo', true);
  const proof  = interaction.options.getAttachment('prova');

  await interaction.deferReply({ ephemeral:true });

  const s = getGuildSettings(interaction.guild.id);
  const targetId = s.userReportsChannelId || s.modLogChannelId;
  const ch = targetId ? (interaction.guild.channels.cache.get(targetId) ?? await interaction.guild.channels.fetch(targetId).catch(()=>null)) : null;

  const embed = nEmbed(interaction.client, { title: 'Segnalazione Utente' })
    .addFields(
      kv('Utente segnalato', `${target} \`${target.tag}\` (${target.id})`, false),
      kv('Segnalato da', `${interaction.user} \`${interaction.user.tag}\``, false),
      kv('Motivo', reason.slice(0, 1024), false),
    );

  if (ch?.isTextBased()) {
    await ch.send({ embeds:[embed], files: proof ? [proof.url] : [] }).catch(()=>{});
    return interaction.editReply('✅ Segnalazione inviata allo staff!');
  }
  return interaction.editReply('❌ Nessun canale report impostato. Usa `/setup setchannel type:reports`.');
}

