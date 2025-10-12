export default async (req, context) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY' }), { status: 500 })
    }

    const body = await req.json()
    const { subject, grade, standardCode, prompt } = body

    const system = `You are Synapse, a teacher co-planner. Create a clear, standards-aligned assignment.
Subject: ${subject}
Grade: ${grade}
Standard: ${standardCode ?? 'N/A'}
Constraints: Accessibility, clarity, scaffolded steps, differentiation suggestions.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${system}\n\nTeacher notes: ${prompt || 'N/A'}\n\nGenerate:` }]
        }]
      })
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(JSON.stringify({ error: 'Gemini upstream error', detail: text }), { status: 502 })
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') ?? 'No content returned.'
    return new Response(JSON.stringify({ text }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Function error', detail: String(e) }), { status: 500 })
  }
}
