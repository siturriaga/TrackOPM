// Lightweight prompt moderation (school-safe). Extend as needed.
const BLOCK_PATTERNS = [
  /\bssn\b|\bsocial security\b/i,
  /\bcredit\s*card\b/i,
  /\bpassword\b/i,
  /\bsexual|explicit|porn\b/i,
  /\bkill|threat|violence\b/i,
];

function moderatePrompt(text = "") {
  if (typeof text !== "string") return { allowed: true };
  for (const re of BLOCK_PATTERNS) {
    if (re.test(text)) {
      return { allowed: false, reason: "Unsafe content in prompt" };
    }
  }
  return { allowed: true };
}

module.exports = { moderatePrompt };
