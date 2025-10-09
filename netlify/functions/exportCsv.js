const { requireUser, json, badRequest } = require('./auth');

exports.handler = async (event) => {
  try {
    await requireUser(event);
    const body = JSON.parse(event.body || "{}");
    const rows = Array.isArray(body.rows) ? body.rows : null;
    if (!rows) return badRequest("Provide 'rows' array");
    const header = Object.keys(rows[0] || {});
    const csv = [header.join(",")].concat(rows.map(r => header.map(h => JSON.stringify(r[h] ?? "")).join(","))).join("\n");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=export.csv" },
      body: csv
    };
  } catch (e) {
    return json(e.statusCode || 500, { error: e.message || String(e) });
  }
};
