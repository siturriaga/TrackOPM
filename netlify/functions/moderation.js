// Lightweight classroom-safe moderation (expand as needed)
const banned = [
  /suicide|self-harm/i,
  /explicit sexual|porn/i,
  /hate\s*speech/i,
];

function moderateInput(text = '') {
  for (const re of banned) if (re.test(text)) {
    return { ok: false, reason: 'Content not allowed for school use.' };
  }
  return { ok: true };
}

module.exports = { moderateInput };
