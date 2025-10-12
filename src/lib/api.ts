export async function generateWithGemini(prompt: string) {
const res = await fetch('/api/gemini', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ prompt })
})
if (!res.ok) {
const err = await res.text()
throw new Error(err || `Gemini error: ${res.status}`)
}
const data = await res.json()
return data.text as string
}
