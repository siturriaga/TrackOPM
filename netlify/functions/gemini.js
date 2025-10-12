export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST')
      return { statusCode: 405, body: 'Method Not Allowed' }

    const { prompt } = JSON.parse(event.body || '{}')
    if (!prompt) return { statusCode: 400, body: 'Missing prompt' }

    const apiKey = process.env.GEMINI_API_KEY
    const endpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'

    const r = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    })

    if (!r.ok) return { statusCode: r.status, body: await r.text() }
    const json = await r.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return { statusCode: 200, body: JSON.stringify({ text }) }
  } catch (e) {
    return { statusCode: 500, body: e.message || 'Server error' }
  }
}
