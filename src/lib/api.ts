export async function generateWithGemini(input: {
  subject: string
  grade: string
  standardCode?: string
  prompt: string
}) {
  const res = await fetch('/.netlify/functions/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Gemini function error')
  const data = await res.json()
  return data.text as string
}
