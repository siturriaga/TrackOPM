import React from 'react'
import { Button } from './Buttons'
import { db } from '../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { generateWithGemini } from '../lib/api'
import {
  loadStandardsIndex,
  loadSubject,
  StandardsIndexEntry,
  SubjectStandards,
  Standard
} from '../lib/standards'

export default function StandardsPlanner({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = React.useState<StandardsIndexEntry[]>([])
  const [subjectMeta, setSubjectMeta] = React.useState<StandardsIndexEntry | null>(null)
  const [subject, setSubject] = React.useState<SubjectStandards | null>(null)
  const [standard, setStandard] = React.useState<Standard | null>(null)

  const [prompt, setPrompt] = React.useState(
    'Create a standards-aligned assignment with objectives, steps, and a short formative quiz. Use benchmarks and item specs to shape rigor and stimulus types.'
  )
  const [output, setOutput] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    loadStandardsIndex().then(setIndex).catch(console.error)
  }, [])

  React.useEffect(() => {
    if (!subjectMeta) return
    setStandard(null)
    setSubject(null)
    loadSubject(subjectMeta.path).then(setSubject).catch(console.error)
  }, [subjectMeta])

  async function handleGenerate() {
    if (!subject || !standard) return
    setBusy(true)
    try {
      const context = [
        `Subject: ${subject.subject}`,
        `Grade: ${subject.grade}`,
        `Standard: ${standard.code} — ${standard.label}`,
        `Benchmarks: ${(standard.benchmarks || []).map(b => `${b.id}: ${b.text}`).join(' | ')}`,
        `Item Specs: ${JSON.stringify(standard.itemSpecs || {})}`
      ].join('\n')
      const text = await generateWithGemini(`${context}\n\nTeacher prompt: ${prompt}`)
      setOutput(text)
    } catch (e: any) {
      setOutput(`Error: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    if (!subject || !standard) return
    await addDoc(collection(db, 'assignments'), {
      subject: subject.subject,
      grade: subject.grade,
      standard: standard.code,
      title: standard.label,
      content: output,
      createdAt: serverTimestamp()
    })
    alert('Saved to Firestore')
  }

  function handleClear() { setOutput('') }

  function handleImportJson(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as SubjectStandards
        setSubject({ ...data })
        setSubjectMeta({ id: 'uploaded', label: `${data.subject} (Uploaded)`, path: 'local' })
        setStandard(null)
      } catch {
        alert('Invalid JSON format')
      }
    }
    reader.readAsText(file)
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

      <div className="grid gap-3 sm:grid-cols-3">
        <select
          className="border rounded-2xl px-3 py-2"
          value={subjectMeta?.id || ''}
          onChange={e => {
            const m = index.find(i => i.id === e.target.value) || null
            setSubjectMeta(m)
          }}
        >
          <option value="">Select subject/grade…</option>
          {index.map(i => (
            <option key={i.id} value={i.id}>{i.label}</option>
          ))}
        </select>

        <select
          className="border rounded-2xl px-3 py-2"
          value={standard?.code || ''}
          onChange={e => {
            const s = subject?.standards.find(s => s.code === e.target.value) || null
            setStandard(s)
          }}
          disabled={!subject}
        >
          <option value="">Choose a standard…</option>
          {subject?.standards.map(s => (
            <option key={s.code} value={s.code}>{s.code} — {s.label}</option>
          ))}
        </select>

        <Button onClick={handleGenerate} disabled={busy || !standard}>
          {busy ? 'Generating…' : 'Generate'}
        </Button>
      </div>

      <textarea
        className="w-full h-28 border rounded-2xl px-3 py-2"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!output || !standard}>Save</Button>
        <Button variant="outline" onClick={handleClear}>Clear</Button>
        <label className="ml-auto text-sm text-brandBlue cursor-pointer">
          <input type="file" accept="application/json" className="hidden" onChange={handleImportJson} />
          Import standards JSON
        </label>
      </div>

      {standard && (
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <h4 className="font-semibold mb-2">Selected: {standard.code}</h4>
          <p className="text-sm text-gray-700 mb-2">{standard.label}</p>
          {!!standard.benchmarks?.length && (
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {standard.benchmarks.map(b => (
                <li key={b.id}><span className="font-medium">{b.id}:</span> {b.text}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <pre className="whitespace-pre-wrap p-4 bg-gray-50 rounded-2xl border border-gray-200">
        {output || 'Output will appear here…'}
      </pre>
    </div>
  )
}
