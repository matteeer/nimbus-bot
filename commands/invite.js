// commands/invite.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const BOT_INVITE =
  'https://discord.com/oauth2/authorize?client_id=1434207650513420338&permissions=8&scope=bot%20applications.commands';

const SUPPORT_SERVER = 'https://discord.gg/An9DGJHhg4';

// aggiorna questo se/quando punti a nimbuscenter.vercel.app
const WEBSITE = 'https://nimbuscenter.vercel.app/';

export const data = new SlashCommandBuilder()
  .setName('invite')
  .setDescription('Mostra i link ufficiali di Nimbus');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: 'Nimbus • Invite' })
    .setDescription(
      [
        'Ecco tutti i link ufficiali di **Nimbus**:',
        '',
        `• **Invita il bot:** [Clicca qui](${BOT_INVITE})`,
        `• **Sito web:** [Nimbus Center](${WEBSITE})`,
        `• **Server di supporto:** [Entra qui](${SUPPORT_SERVER})`,
      ].join('\n'),
    )
    .setFooter({ text: 'Nimbus • /invite' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: false });
}
