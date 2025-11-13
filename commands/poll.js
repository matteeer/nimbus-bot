// commands/poll.js
import { SlashCommandBuilder } from 'discord.js';
import { nEmbed, lineBreak } from '../utils/ui.js';

const NUM_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Crea un sondaggio con reazioni')
  .addStringOption(o=>o.setName('domanda').setDescription('Domanda del sondaggio').setRequired(true))
  .addStringOption(o=>o.setName('opzioni').setDescription('Opzioni separate da ; (min 2, max 10)').setRequired(true))
  .addStringOption(o=>o.setName('durata').setDescription('Es: 10m, 1h, 1d (testo informativo)'))
  .setDMPermission(false);

export async function execute(interaction) {
  const q  = interaction.options.getString('domanda', true);
  const raw= interaction.options.getString('opzioni', true);
  const duration = interaction.options.getString('durata') ?? null;

  const options = raw.split(';').map(s=>s.trim()).filter(Boolean).slice(0,10);
  if (options.length<2) return interaction.reply({ content:'❌ Minimo 2 opzioni.', ephemeral:true });

  const desc = options.map((opt,i)=> `${NUM_EMOJIS[i]}  **${opt}**`).join(lineBreak());

  const embed = nEmbed(interaction.client, {
    title: 'Sondaggio',
    description: [
      `**${q}**`,
      lineBreak(),
      desc,
      lineBreak(),
      duration ? `🕒 Termina tra: **${duration}** (indicativo)` : 'Reagisci con l’emoji corrispondente per votare.',
    ].join(lineBreak()),
  });

  await interaction.reply({ embeds:[embed] });
  const msg = await interaction.fetchReply();
  for (let i=0; i<options.length; i++) await msg.react(NUM_EMOJIS[i]).catch(()=>{});
}

