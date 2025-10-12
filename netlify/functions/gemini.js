// Node-based Netlify Function that proxies Gemini requests
export default async function handler(req, res) {
try {
if (req.method !== 'POST') {
res.status(405).send('Method Not Allowed')
return
}
const { prompt } = req.body || {}
if (!prompt) {
res.status(400).send('Missing prompt')
return
}
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
res.status(500).send('Missing GEMINI_API_KEY')
return
}


const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
const r = await fetch(`${endpoint}?key=${apiKey}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }]}] })
})


if (!r.ok) {
const errText = await r.text()
res.status(r.status).send(errText)
return
}
const json = await r.json()
const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
res.status(200).json({ text })
} catch (e) {
res.status(500).send(e.message || 'Server error')
}
}
Netlify Note: Newer Netlify environments may prefer export const handler = ... commonjs style. If your site throws an error, replace the top line with:
export const handler = async (event) => {
try {
if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
const { prompt } = JSON.parse(event.body || '{}')
if (!prompt) return { statusCode: 400, body: 'Missing prompt' }
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) return { statusCode: 500, body: 'Missing GEMINI_API_KEY' }
const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
const r = await fetch(`${endpoint}?key=${apiKey}`, {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }]}] })
})
if (!r.ok) return { statusCode: r.status, body: await r.text() }
const json = await r.json()
const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
return { statusCode: 200, body: JSON.stringify({ text }) }
} catch (e) {
return { statusCode: 500, body: e.message || 'Server error' }
}
}

