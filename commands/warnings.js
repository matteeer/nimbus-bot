// commands/warnings.js
import { SlashCommandBuilder } from 'discord.js';
import { nEmbed, lineBreak } from '../utils/ui.js';
import { getWarns } from '../utils/warns.js';

export const data = new SlashCommandBuilder()
  .setName('warnings').setDescription('Mostra i warning di un utente')
  .addUserOption(o=>o.setName('utente').setDescription('Utente').setRequired(true))
  .addIntegerOption(o=>o.setName('pagina').setDescription('Pagina').setMinValue(1))
  .setDMPermission(false);

export async function execute(interaction){
  const u = interaction.options.getUser('utente', true);
  const page = interaction.options.getInteger('pagina') ?? 1;
  const perPage = 5;
  const all = getWarns(interaction.guild.id, u.id);
  const totalPages = Math.max(1, Math.ceil(all.length/perPage));
  const p = Math.min(Math.max(1,page), totalPages);
  const slice = all.slice((p-1)*perPage, (p-1)*perPage+perPage);

  const lines = slice.length ? slice.map((w,i)=> {
    const idx = (p-1)*perPage + i + 1;
    return `**#${idx}** • <t:${Math.floor(w.ts/1000)}:R>\nMotivo: ${w.reason}\nMod: <@${w.modId}>`;
  }).join(lineBreak(2)) : '— Nessun warning —';

  const embed = nEmbed(interaction.client, {
    title: 'Warnings',
    description: `Utente: **${u.tag}** (${u.id})\n\n${lines}\n\nPagina **${p}/${totalPages}**`,
  });
  return interaction.reply({ embeds:[embed], ephemeral:true });
}
