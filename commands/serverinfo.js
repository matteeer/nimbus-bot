// commands/serverinfo.js
import { SlashCommandBuilder, ChannelType, Colors } from 'discord.js';
import { nEmbed, kv, lineBreak } from '../utils/ui.js';

function fmt(x){ return new Intl.NumberFormat('it-IT').format(x); }
function rel(ts){ return `<t:${Math.floor(ts/1000)}:R>`; }

export const data = new SlashCommandBuilder()
  .setName('serverinfo').setDescription('Mostra le info del server');

export async function execute(interaction) {
  const g = interaction.guild;
  await g.fetch().catch(()=>{});

  let ownerTag = '—';
  try { const owner = await g.fetchOwner(); ownerTag = `${owner.user.tag} (${owner.id})`; } catch {}

  const chs = g.channels.cache;
  const text = chs.filter(c=>c.type===ChannelType.GuildText).size;
  const voice= chs.filter(c=>c.type===ChannelType.GuildVoice).size;
  const forum= chs.filter(c=>c.type===ChannelType.GuildForum).size;
  const stage= chs.filter(c=>c.type===ChannelType.GuildStageVoice).size;
  const cats = chs.filter(c=>c.type===ChannelType.GuildCategory).size;

  const mCount = g.memberCount ?? 0;
  let humans=0,bots=0;
  try {
    const members = await g.members.fetch();
    humans = members.filter(m=>!m.user.bot).size;
    bots   = members.filter(m=> m.user.bot).size;
  } catch {
    bots = g.members.cache.filter(m=>m.user.bot).size;
    humans = Math.max(mCount - bots, 0);
  }

  const embed = nEmbed(interaction.client, {
    title: 'Server Info',
    thumbnail: g.iconURL({ size: 256 }) ?? null,
    color: Colors.Blurple
  }).addFields(
    kv('Nome', `${g.name}`, true),
    kv('ID', `\`${g.id}\``, true),
    kv('Owner', ownerTag, false),
    kv('Creato', `${rel(g.createdTimestamp)}\n<t:${Math.floor(g.createdTimestamp/1000)}:f>`, true),
    kv('Membri', [
      `Totali: **${fmt(mCount)}**`,
      `👤 Umani: **${fmt(humans)}**`,
      `🤖 Bot: **${fmt(bots)}**`,
    ].join(lineBreak()), true),
    kv('Canali', [
      `📝 Testo: **${fmt(text)}**   🔊 Voce: **${fmt(voice)}**`,
      `🗂️ Categorie: **${fmt(cats)}**`,
      `📰 Forum: **${fmt(forum)}**   🎙️ Stage: **${fmt(stage)}**`,
    ].join(lineBreak()), false),
    kv('Boost', `Livello: **${g.premiumTier ?? 0}**\nBoost attivi: **${fmt(g.premiumSubscriptionCount ?? 0)}**`, true),
    kv('Varie', `Locale: **${g.preferredLocale ?? 'N/D'}**\nVerifica: **${g.verificationLevel}**`, true),
  );

  return interaction.reply({ embeds: [embed] });
}

