// utils/transcript.js
import { AttachmentBuilder } from 'discord.js';

export async function makeThreadTranscript(thread, opts = { includeSystem: false }) {
  // fetch tutto (paginazione)
  let lastId = undefined;
  const all = [];
  while (true) {
    const batch = await thread.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
    if (!batch || batch.size === 0) break;
    for (const m of batch.values()) all.push(m);
    lastId = batch.last().id;
    if (batch.size < 100) break;
  }

  // ordina dal più vecchio al più recente
  all.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  // format
  const lines = [];
  lines.push(`=== Transcript: #${thread.name} (${thread.id}) ===`);
  lines.push(`Guild: ${thread.guild?.name} (${thread.guild?.id})`);
  lines.push(`Channel: #${thread.parent?.name} (${thread.parentId})`);
  lines.push(`Created: ${thread.createdAt?.toISOString()}`);
  lines.push('-------------------------------------------');

  for (const m of all) {
    if (!opts.includeSystem && m.system) continue;
    const author = m.author?.tag ?? 'Unknown';
    const time = new Date(m.createdTimestamp).toISOString();
    const content = (m.content ?? '').replace(/\n/g, '\n  ');
    lines.push(`[${time}] ${author}: ${content}`);
    if (m.attachments?.size) {
      for (const a of m.attachments.values()) {
        lines.push(`  [attachment] ${a.name} -> ${a.url}`);
      }
    }
  }

  if (lines.length === 0) lines.push('[no messages]');
  const buf = Buffer.from(lines.join('\n'), 'utf8');
  return new AttachmentBuilder(buf, { name: `transcript_${thread.id}.txt` });
}
