import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ensureGuild, getGuildSettings, saveGuildSettings } from '../utils/settings.js';

// ===== BUTTON / TOGGLE =====
export async function handleWelcomeButton(interaction) {
  ensureGuild(interaction.guild.id);
  const settings = getGuildSettings(interaction.guild.id);

  // Toggle stato welcome
  settings.welcome.enabled = !settings.welcome.enabled;
  await saveGuildSettings(interaction.guild.id, settings);

  const status = settings.welcome.enabled ? '🟢 Attivo' : '🔴 Disattivato';

  // Select menu canali testuali
  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('NIMBUS_WEL_SELECT')
      .setPlaceholder('Seleziona il canale di benvenuto')
      .addOptions(
        interaction.guild.channels.cache
          .filter(c => c.isTextBased())
          .map(c => ({ label: c.name, value: c.id }))
      )
  );

  // Button toggle
  const toggleButton = new ButtonBuilder()
    .setCustomId('NIMBUS_WEL_TOGGLE')
    .setLabel(settings.welcome.enabled ? 'Disattiva' : 'Attiva')
    .setStyle(settings.welcome.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const buttonRow = new ActionRowBuilder().addComponents(toggleButton);

  const embed = new EmbedBuilder()
    .setTitle('🤖 Welcome Panel')
    .setDescription(`Stato: **${status}**\nSeleziona un canale e premi il bottone per salvare`)
    .setColor('#5865F2');

  await interaction.update({ embeds: [embed], components: [selectRow, buttonRow] });
}

// ===== SELECT MENU =====
export async function handleWelcomeSelect(interaction) {
  ensureGuild(interaction.guild.id);
  const settings = getGuildSettings(interaction.guild.id);

  const selectedChannelId = interaction.values[0];
  settings.welcome.channelId = selectedChannelId;
  await saveGuildSettings(interaction.guild.id, settings);

  await interaction.reply({ content: `✅ Canale welcome impostato su <#${selectedChannelId}>`, ephemeral: true });
}

// ===== MODAL (messaggio personalizzato) =====
export async function handleWelcomeModal(interaction) {
  ensureGuild(interaction.guild.id);
  const settings = getGuildSettings(interaction.guild.id);

  const msg = interaction.fields.getTextInputValue('welcomeMessage');
  settings.welcome.message = msg;
  await saveGuildSettings(interaction.guild.id, settings);

  await interaction.reply({ content: '✅ Messaggio welcome aggiornato!', ephemeral: true });
}

// ===== JOIN EVENT =====
export async function welcomeOnJoin(member) {
  ensureGuild(member.guild.id);
  const settings = getGuildSettings(member.guild.id);
  const w = settings.welcome;
  if (!w?.enabled || !w.channelId) return;

  const ch =
    member.guild.channels.cache.get(w.channelId) ??
    await member.guild.channels.fetch(w.channelId).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const mention = w.pingUser ? member.toString() : `**${member.user.tag}**`;
  const allowedMentions = w.pingUser ? { users: [member.id] } : { parse: [] };
  const msg = w.message?.replace('{user}', mention).replace('{server}', member.guild.name) || `${mention} è entrato in **${member.guild.name}** 🎉`;

  if (w.embed?.enabled) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Benvenuto!')
      .setDescription(msg)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();
    await ch.send({ content: w.pingUser ? mention : null, embeds: [embed], allowedMentions });
  } else {
    await ch.send({ content: msg, allowedMentions });
  }
}
