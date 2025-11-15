// commands/invite.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const SUPPORT_SERVER = 'https://discord.gg/An9DGJHhg4';
const WEBSITE = 'https://nimbuscenter.vercel.app';
// se vuoi cambiare dominio, modifichi QUI sopra
const CLIENT_ID = '1434207650513420338';

const INVITE_URL =
  `https://discord.com/oauth2/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&permissions=8` +
  `&scope=bot%20applications.commands`;

export const data = new SlashCommandBuilder()
  .setName('invite')
  .setDescription('Mostra i link ufficiali di Nimbus.');

export async function execute(interaction) {
  const botUser = interaction.client.user;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: botUser.tag,
      iconURL: botUser.displayAvatarURL({ size: 128 })
    })
    .setTitle('Links')
    .setDescription(
      [
        '✅ Ecco i link ufficiali di Nimbus:',
        '',
        `• **Invita Nimbus:** [clicca qui](${INVITE_URL})`,
        `• **Server di supporto:** [unisciti](${SUPPORT_SERVER})`,
        `• **Sito web:** [apri nimbuscenter](${WEBSITE})`
      ].join('\n')
    )
    .setFooter({ text: 'Nimbus • Links ufficiali' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
