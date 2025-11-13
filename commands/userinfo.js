// commands/userinfo.js
import { SlashCommandBuilder, Colors, PermissionFlagsBits } from 'discord.js';
import { nEmbed, kv } from '../utils/ui.js';

function rel(ts){ return `<t:${Math.floor(ts/1000)}:R>`; }

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Mostra le info di un utente')
  .addUserOption(o=>o.setName('utente').setDescription('Scegli un utente (opzionale)'))
  .setDMPermission(false);

export async function execute(interaction) {
  const user = interaction.options.getUser('utente') ?? interaction.user;
  const u = await interaction.client.users.fetch(user.id, { force:true }).catch(()=>user);
  const member = await interaction.guild.members.fetch(user.id).catch(()=>null);

  let rolesList = '—';
  if (member) {
    const roles = member.roles.cache
      .filter(r=>r.id!==interaction.guild.id)
      .sort((a,b)=>b.position-a.position)
      .map(r=>r.toString());
    rolesList = roles.slice(0, 12).join(' ') || '—';
    if (roles.length>12) rolesList += ` …(+${roles.length-12})`;
  }

  const perms = member?.permissions;
  const isStaff = perms?.has(PermissionFlagsBits.Administrator) ||
                  perms?.has(PermissionFlagsBits.ManageGuild) ||
                  perms?.has(PermissionFlagsBits.ModerateMembers) ||
                  perms?.has(PermissionFlagsBits.BanMembers) ||
                  perms?.has(PermissionFlagsBits.KickMembers);

  const embed = nEmbed(interaction.client, {
    title: 'User Info',
    thumbnail: u.displayAvatarURL({ size:256 }),
    color: member?.displayHexColor && member.displayHexColor!=='#000000' ? member.displayHexColor : Colors.Blurple
  }).addFields(
    kv('Utente', `${u} \`${u.tag}\`\nID: \`${u.id}\``),
    kv('Account creato', `${rel(u.createdTimestamp)}\n<t:${Math.floor(u.createdTimestamp/1000)}:f>`, true),
    kv('Entrato nel server', member?.joinedTimestamp
      ? `${rel(member.joinedTimestamp)}\n<t:${Math.floor(member.joinedTimestamp/1000)}:f>` : '—', true),
    kv('Top role', member?.roles?.highest ? `${member.roles.highest} (pos ${member.roles.highest.position})` : '—', true),
    kv('Ruoli', rolesList, false),
    kv('Staff?', isStaff ? '✅ Sì' : '❌ No', true),
  );

  const banner = u.bannerURL?.({ size:512 });
  if (banner) embed.setImage(banner);

  return interaction.reply({ embeds: [embed] });
}

