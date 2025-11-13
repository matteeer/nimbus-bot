// commands/help-welcome.js
import { SlashCommandBuilder } from 'discord.js';
import { nEmbed, lineBreak, kv } from '../utils/ui.js';

export const data = new SlashCommandBuilder()
  .setName('help-welcome')
  .setDescription('Guida completa al sistema di benvenuto (embed)');

export async function execute(interaction) {
  const desc = [
    '**Cosa fa**',
    'Invia un messaggio di benvenuto quando entra un nuovo membro. Può essere **testo** o **embed** super personalizzato (titolo, descrizione con placeholder, colore, thumbnail, immagine, footer).',
    '',
    '**Placeholder**',
    '`{user}` → menzione del nuovo utente',
    '`{server}` → nome del server',
    '',
    '**Setup rapido (consigliato)**',
    '1) `/welcome setchannel #benvenuti` – scegli il canale',
    '2) `/welcome toggle true` – attiva il welcome',
    '3) `/welcome embed-toggle true` – usa gli embed',
    '4) `/welcome panel` – pannello per modifiche rapide (bottoni + modali)',
    '5) `/welcome test` – anteprima nel canale',
    '',
    '**Personalizzazione (subcommands)**',
    '• `/welcome embed-title [testo]` – titolo dell’embed (supporta placeholder)',
    '• `/welcome embed-description [testo]` – descrizione (multiriga + placeholder)',
    '• `/welcome embed-color [#RRGGBB|blurple|green|red]` – colore bordo',
    '• `/welcome embed-thumbnail [user|server|custom|none] (url)` – icona a destra',
    '• `/welcome embed-image [url|none]` – immagine grande',
    '• `/welcome embed-footer [testo|none]` – footer',
    '',
    '**Pannello generale**',
    '`/welcome panel` ti mostra stato (ON/OFF), canale, titolo/descrizione correnti, e ti dà:',
    '• **ON/OFF Welcome** — attiva/disattiva',
    '• **ON/OFF Embed** — passa da testo a embed',
    '• **Titolo** / **Descrizione** — modali per editare al volo',
    '• **Test** — invia un welcome di prova',
    '',
    '**Note**',
    '• Se embed è OFF, viene inviato il messaggio testuale (configurabile in futuro).',
    '• Ricordati di impostare i permessi di scrittura nel canale di benvenuto.',
  ].join(lineBreak());

  const embed = nEmbed(interaction.client, {
    title: 'Guida — Welcome (Nimbus)',
    description: desc,
  });

  return interaction.reply({ embeds: [embed], ephemeral: true });
}
