// commands/help.js
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { nEmbed } from '../utils/ui.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Mostra il menu di aiuto principale o una sezione specifica.')
  .addStringOption(opt =>
    opt
      .setName('sezione')
      .setDescription('Categoria: moderation, automod, tickets, settings, utility, info')
      .setRequired(false)
  );

export async function execute(interaction) {
  const section = interaction.options.getString('sezione');

  if (!section) {
    const embed = nEmbed(interaction.client, {
      title: 'NIMBUS — Help',
      description: [
        'Usa `/help sezione:<nome>` per vedere i dettagli di una categoria.',
        '',
        '**Legenda parametri**',
        '[ ] = obbligatorio',
        '( ) = opzionale',
        '{ } = condizione',
        '{@User/ID} = tag o id utente',
        '❗ Non mettere i simboli <> [] {} nel comando.',
        '',
        '⚔️ **Moderation** — Ban, kick, mute, warn…',
        '🛡️ **Automoderation** — Antispam, antiflood, antiraid, antinuke, captcha',
        '🎫 **Tickets** — Pannello ticket, add/remove, close, transcript',
        '⚙️ **Settings** — Impostazioni generali e AutoMod',
        '🧩 **Utility** — Sondaggi, report bug/user, ecc.',
        'ℹ️ **Info** — Bot, server, utente, questo help',
      ].join('\n'),
    });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('HELP_MODERATION').setLabel('Vai a Moderation').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('HELP_AUTOMOD').setLabel('Vai a Automod').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('HELP_TICKETS').setLabel('Vai a Tickets').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('HELP_SETTINGS').setLabel('Vai a Settings').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('HELP_UTILITY').setLabel('Vai a Utility').setStyle(ButtonStyle.Primary),
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('HELP_INFO').setLabel('Vai a Info').setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({ embeds: [embed], components: [row1, row2] });
  }

  const sectionEmbed = buildSectionEmbed(interaction.client, section.toLowerCase());
  if (!sectionEmbed) {
    return interaction.reply({ content: '❌ Sezione non trovata.', flags: MessageFlags.Ephemeral });
  }
  return interaction.reply({ embeds: [sectionEmbed], flags: MessageFlags.Ephemeral });
}

export async function handleHelpButton(interaction) {
  // 👉 defer PRIMA di fare qualsiasi cosa, così il token non scade
  await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

  const id = interaction.customId;
  let section = null;

  if (id === 'HELP_MODERATION') section = 'moderation';
  if (id === 'HELP_AUTOMOD') section = 'automod';
  if (id === 'HELP_TICKETS') section = 'tickets';
  if (id === 'HELP_SETTINGS') section = 'settings';
  if (id === 'HELP_UTILITY') section = 'utility';
  if (id === 'HELP_INFO') section = 'info';

  const embed = buildSectionEmbed(interaction.client, section);
  if (!embed) {
    return interaction.editReply({ content: '❌ Sezione non trovata.' }).catch(()=>{});
  }
  return interaction.editReply({ embeds: [embed] }).catch(()=>{});
}

/* =================================================================
   SEZIONI HELP
   ================================================================= */
function buildSectionEmbed(client, section) {
  const color = 0x5865f2;
  const foot = { text: `nimbus • help: ${section}` };

  switch (section) {
    case 'moderation':
      return new EmbedBuilder()
        .setColor(color)
        .setTitle('⚔️ Moderation — Comandi principali')
        .setDescription([
          '**/ban [@User/ID] (time) (reason)** — banna un utente.',
          '**/unban [@User/ID] (reason)** — sbanna un utente.',
          '**/kick [@User/ID] (reason)** — espelle un utente.',
          '**/mute [@User/ID] (time) (reason)** — timeout utente.',
          '**/unmute [@User/ID] (reason)** — rimuove timeout.',
          '**/warn [@User/ID] (reason)** — avvisa un utente.',
          '**/unwarn [@User/ID] [n] (reason)** — rimuove un avviso.',
          '**/clearwarns [@User/ID]** — cancella tutti gli avvisi.',
          '**/warnings [@User/ID]** — mostra gli avvisi dell’utente.',
          '**/clear [n]** — cancella n messaggi nel canale.',
        ].join('\n'))
        .setFooter(foot);

    case 'automod':
      return new EmbedBuilder()
        .setColor(color)
        .setTitle('🛡️ AutoModeration — Sicurezza automatica')
        .setDescription([
          '**Attivabili dal comando:** `/setup automod`',
          '',
          '**antispam [enable/disable]** — blocca spam massivo.',
          '**antiflood [enable/disable]** — evita flood di messaggi.',
          '**antiraid [enable/disable]** — blocca join di massa.',
          '**antiscam [enable/disable]** — filtra link pericolosi.',
          '**antinuke [enable/disable]** — protegge ruoli/canali/ban di massa.',
          '**captcha [enable/disable]** — verifica utenti con captcha.',
        ].join('\n'))
        .setFooter(foot);

    case 'tickets':
      return new EmbedBuilder()
        .setColor(color)
        .setTitle('🎫 Tickets — Pannello & Gestione')
        .setDescription([
          '**/ticket panel** — invia il pannello per aprire i ticket.',
          '**/ticket setchannel** — imposta il canale per i ticket.',
          '**/ticket close** — chiude il ticket e salva transcript.',
        ].join('\n'))
        .setFooter(foot);

    case 'settings':
      return new EmbedBuilder()
        .setColor(color)
        .setTitle('⚙️ Settings — Configurazione generale')
        .setDescription([
          '**/setup setlog** — imposta canale log.',
          '**/setup automod** — parametri automoderazione.',
          '**/welcome** — gestione benvenuto (canale, embed, test).',
          '**/setup setchannel** — imposta i canali di servizio (ticket/report)'
        ].join('\n'))
        .setFooter(foot);

    case 'utility':
      return new EmbedBuilder()
        .setColor(color)
        .setTitle('🧩 Utility — Strumenti utili')
        .setDescription([
          '**/poll** — crea un sondaggio rapido.',
          '**/reportbug** — istruzioni per segnalare bug (con link al support).',
          '**/reportuser [@User] (reason)** — segnala un utente allo staff.',
          '**/serverinfo** — info server.',
          '**/userinfo [@User]** — info utente.',
        ].join('\n'))
        .setFooter(foot);

    case 'info':
      return new EmbedBuilder()
        .setColor(color)
        .setTitle('ℹ️ Info — Comandi informativi')
        .setDescription([
          '**/botinfo** — info bot (RAM, ping, uptime, versione).',
          '**/serverinfo** — info server attuale.',
          '**/userinfo [@User]** — dettagli utente.',
          '**/help** — questo menu.',
        ].join('\n'))
        .setFooter(foot);

    default:
      return null;
  }
}


