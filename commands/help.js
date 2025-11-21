// commands/help.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Mostra la lista dei comandi di Nimbus.');

// mappa categorie → testo
function buildHelpEmbed(category, client) {
  const bot = client.user;
  const base = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: bot.tag,
      iconURL: bot.displayAvatarURL({ size: 128 })
    })
    .setTimestamp();

  switch (category) {
    case 'MOD':
      return base
        .setTitle('Help • Moderazione')
        .setDescription(
          [
            '**/ban** – banna un utente dal server (opzionale motivo).',
            '**/unban** – rimuove il ban a un utente.',
            '**/kick** – espelle un utente dal server.',
            '**/timeout** – mette in timeout un utente per X minuti.',
            '**/removetimeout** – rimuove il timeout da un utente.',
            '**/lock** – blocca il canale corrente.',
            '**/clear** – elimina un numero di messaggi recenti.',
            '**/warn** – assegna un avvertimento a un utente.',
            '**/unwarn** – rimuove un warning specifico.',
            '**/clearwarns** – elimina tutti i warning di un utente.',
            '**/warnings** – mostra i warning di un utente.'
          ].join('\n')
        );

    case 'INFO':
      return base
        .setTitle('Help • Info')
        .setDescription(
          [
            '**/botinfo** – info su Nimbus (ping, versione, ID, ecc).',
            '**/serverinfo** – info sul server corrente.',
            '**/userinfo** – info su un utente (ruoli, join, ecc).',
            '**/uptime** – da quanto tempo Nimbus è online.'
          ].join('\n')
        );

    case 'SETUP':
      return base
        .setTitle('Help • Setup')
        .setDescription(
          [
            '**/setup automod** – configura il sistema AutoMod (on/off).',
            '**/setup channels** - imposta i canali di servizio (tickets/report user)',
            '**/setup log** - imposta il canale dei log di moderazione/sistema',
            '**/setup reset** - resetta la configurazione base di Nimbus (log e canali di servizio)', 
            '**/welcome** – apre il pannello per configurare i messaggi di benvenuto.',
            '**/ticket panel** – imposta il pannello ticket.'
          ].join('\n')
        );

    case 'UTIL':
      return base
        .setTitle('Help • Utility')
        .setDescription(
          [
            '**/invite** – mostra i link ufficiali (invito bot, support server, sito).',
            '**/ping** – mostra la latenza del bot.',
            '**/poll** – crea un semplice sondaggio.',
            '**/reportuser** – segnala un utente allo staff del server.'
          ].join('\n')
        );

    case 'TICKETS':
      return base
        .setTitle('Help • Tickets')
        .setDescription(
          [
            '**/ticket panel** – invia il pannello per aprire i ticket.',
            '**/icket close** - chiude il ticket corrente', 
            '',
            '*Gli utenti potranno aprire un ticket premendo il pulsante nel pannello.*'
          ].join('\n')
        );

    default:
      // view generale
      return base
        .setTitle('Help')
        .setDescription(
          [
            'Benvenuto nel pannello di aiuto di **Nimbus**.',
            '',
            'Usa i bottoni qui sotto per navigare tra le categorie:',
            '',
            '🛡️ Moderazione – ban, kick, timeout, warn, clear…',
            'ℹ️ Info – botinfo, serverinfo, userinfo, uptime…',
            '🛠️ Setup – automod, welcome, ticket panel…',
            '🧰 Utility – invite, poll, reportuser…',
            '🎫 Tickets – gestione dei ticket di supporto.'
          ].join('\n')
        );
  }
}

// row bottoni
function buildHelpRow(active = 'MAIN') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('HELP_MAIN')
      .setLabel('Generale')
      .setStyle(active === 'MAIN' ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('HELP_MOD')
      .setLabel('Moderazione')
      .setStyle(active === 'MOD' ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('HELP_INFO')
      .setLabel('Info')
      .setStyle(active === 'INFO' ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('HELP_SET')
      .setLabel('Setup')
      .setStyle(active === 'SETUP' ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('HELP_TICKETS')
      .setLabel('Tickets')
      .setStyle(active === 'TICKETS' ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );
}

export async function execute(interaction) {
  const embed = buildHelpEmbed('MAIN', interaction.client);
  const row = buildHelpRow('MAIN');

  await interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

// handler bottoni (usato in index.js)
export async function handleHelpButton(interaction) {
  const id = interaction.customId;
  let category = 'MAIN';

  if (id === 'HELP_MAIN') category = 'MAIN';
  else if (id === 'HELP_MOD') category = 'MOD';
  else if (id === 'HELP_INFO') category = 'INFO';
  else if (id === 'HELP_SET') category = 'SETUP';
  else if (id === 'HELP_TICKETS') category = 'TICKETS';
  else return;

  const embed = buildHelpEmbed(category, interaction.client);
  const row = buildHelpRow(category);

  // update dello stesso messaggio, niente reply nuove
  await interaction.update({
    embeds: [embed],
    components: [row]
  });
}
