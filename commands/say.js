// commands/say.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Invia un messaggio come Nimbus in un canale.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setDMPermission(false)
  // PRIMA l'opzione obbligatoria
  .addStringOption(opt =>
    opt
      .setName('testo')
      .setDescription('Contenuto del messaggio.')
      .setRequired(true),
  )
  // POI le opzionali
  .addChannelOption(opt =>
    opt
      .setName('canale')
      .setDescription('Canale dove inviare il messaggio (default: questo).')
      .setRequired(false),
  )
  .addBooleanOption(opt =>
    opt
      .setName('embed')
      .setDescription('Invia il messaggio come embed (default: sì).')
      .setRequired(false),
  );

export async function execute(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Questo comando può essere usato solo in un server.',
      ephemeral: true,
    });
  }

  const text = interaction.options.getString('testo', true);
  const targetChannel =
    interaction.options.getChannel('canale') ?? interaction.channel;
  const asEmbed = interaction.options.getBoolean('embed') ?? true;

  if (!targetChannel.isTextBased()) {
    return interaction.reply({
      content: '❌ Devo inviare il messaggio in un canale testuale.',
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    if (asEmbed) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setDescription(text)
        .setTimestamp();

      await targetChannel.send({ embeds: [embed] });
    } else {
      await targetChannel.send({ content: text });
    }

    await interaction.editReply({
      content: '✅ Messaggio inviato.',
    });
  } catch (err) {
    console.error('say error:', err);
    await interaction.editReply({
      content: '❌ Non sono riuscito a inviare il messaggio. Controlla i permessi di Nimbus.',
    });
  }
}
