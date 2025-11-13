// commands/reportbug.js
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { nEmbed, lineBreak } from '../utils/ui.js';

export const data = new SlashCommandBuilder()
  .setName('reportbug')
  .setDescription('Come segnalare un bug di Nimbus (server di supporto)');

export async function execute(interaction) {
  // Metti l’invite nello .env: SUPPORT_INVITE=https://discord.gg/SKg96wJA9b
  const invite = (process.env.SUPPORT_INVITE || 'https://discord.gg/SKg96wJA9b').trim();

  const embed = nEmbed(interaction.client, {
    title: 'Segnala un bug',
    description: [
      'Per favore esponi il problema nel **server di supporto** di Nimbus, così ti aiutiamo al volo.',
      '',
      // Lasciamo comunque il link in chiaro nel testo (optional)
      // `[Unisciti al server](${invite})`,
      'Ricorda di includere:',
      '• Passaggi per riprodurre il bug',
      '• Cosa ti aspettavi vs. cosa succede',
      '• Screenshot/log se possibile',
    ].join(lineBreak()),
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Unisciti al server')
      .setStyle(ButtonStyle.Link)
      .setURL(invite)
  );

  return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}
