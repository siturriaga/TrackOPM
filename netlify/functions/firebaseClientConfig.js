// Netlify Function: returns your Firebase Web config (public client config).
// Inline values avoid env var issues and unblock Firebase initialization.

function json(status, body) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'GET') return json(405, { error: "Method Not Allowed" });

  // 🔓 Firebase Web config is safe to expose (client SDK uses it)
  return json(200, {
    apiKey: "AIzaSyBT95w8fzJr9J5WCYe8iwFkvSrwXds5sms",
    authDomain: "trackopmn.firebaseapp.com",
    projectId: "trackopmn",
    appId: "1:325895934431:web:50665d95aab0ac1a4b746a",
    storageBucket: "trackopmn.firebasestorage.app",
    messagingSenderId: "325895934431",
    measurementId: "G-QX53NY1CJC"
  });
};
