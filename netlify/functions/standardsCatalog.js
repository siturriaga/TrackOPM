const { requireUser, json, badRequest } = require("./auth");
const catalog = require("./standardsCatalog");

exports.handler = async (event) => {
  try {
    await requireUser(event); // verifies Google ID token

    const body = JSON.parse(event.body || "{}");
    let { subject, grade } = body;
    if (!subject || !grade) return badRequest("Both 'subject' and 'grade' are required");

    subject = String(subject).trim().toLowerCase();
    grade = String(grade).trim();

    const aliases = { ela:"english language arts", english:"english language arts", math:"mathematics" };
    subject = aliases[subject] || subject;

    const key = `${subject}|${grade}`;
    const standards = catalog[key] || [];
    return json(200, { standards });
  } catch (err) {
    return json(500, { error: err?.message || String(err) });
  }
};
