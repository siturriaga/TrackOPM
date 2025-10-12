import React from 'react'
import { Button } from './Buttons'
import { db } from '../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { generateWithGemini } from '../lib/api'


export default function StandardsPlanner({ onBack }: { onBack: () => void }) {
const [standard, setStandard] = React.useState('SS.7.CG.1.1')
const [grade, setGrade] = React.useState('7')
const [prompt, setPrompt] = React.useState('Create a standards-aligned assignment with objectives, steps, and a short formative quiz.')
const [output, setOutput] = React.useState('')
const [busy, setBusy] = React.useState(false)


async function handleGenerate() {
setBusy(true)
try {
const text = await generateWithGemini(`Grade ${grade} | Standard ${standard} | ${prompt}`)
setOutput(text)
} catch (e:any) {
setOutput(`Error: ${e.message}`)
} finally {
setBusy(false)
}
}


async function handleSave() {
await addDoc(collection(db, 'assignments'), {
standard, grade, content: output, createdAt: serverTimestamp()
})
alert('Saved to Firestore')
}


function handleClear() {
setOutput('')
}


return (
<div className="space-y-4">
<div className="flex items-center justify-between">
<h2 className="text-xl font-semibold">Standards Planner</h2>
<div className="flex gap-2">
<Button variant="outline" onClick={onBack}>Back</Button>
<Button variant="outline" onClick={() => window.location.assign('/')}>Exit</Button>
</div>
</div>


<div className="grid sm:grid-cols-3 gap-3">
<input className="border rounded-2xl px-3 py-2" value={standard} onChange={e=>setStandard(e.target.value)} placeholder="Standard e.g., SS.7.CG.1.1" />
<input className="border rounded-2xl px-3 py-2" value={grade} onChange={e=>setGrade(e.target.value)} placeholder="Grade e.g., 7" />
<Button onClick={handleGenerate} disabled={busy}>{busy? 'Generating…' : 'Generate'}</Button>
</div>


<textarea className="w-full h-28 border rounded-2xl px-3 py-2" value={prompt} onChange={e=>setPrompt(e.target.value)} />


<div className="space-x-2">
<Button onClick={handleSave} disabled={!output}>Save</Button>
<Button variant="outline" onClick={handleClear}>Clear</Button>
</div>
}
