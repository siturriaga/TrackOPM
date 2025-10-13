import React, { useState, useMemo, useEffect } from 'react'
import { Button } from './Buttons'
import { listSubjects, listGrades, listStandardsFor } from '../lib/standards'

type Props = {
  onGenerate: (details: { subject: string; grade: string; standardCode?: string; prompt: string }) => Promise<void>
  onSave: (details: { subject: string; grade: string; standardCode?: string; prompt: string; output: string }) => Promise<void>
  isGenerating: boolean
  isSaving: boolean
  output: string
  setOutput: (output: string) => void
}

export default function GenerationPanel({ onGenerate, onSave, isGenerating, isSaving, output, setOutput }: Props) {
  const subjects = useMemo(() => listSubjects(), [])
  const [subject, setSubject] = useState(subjects[0] ?? 'Civics')
  const [grade, setGrade] = useState(listGrades()[0] ?? '7')
  const [standardCode, setStandardCode] = useState<string | undefined>(undefined)
  const [availableStandards, setAvailableStandards] = useState<{ code: string; title: string }[]>([])
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const list = await listStandardsFor(subject, grade)
      if (alive) {
        setAvailableStandards(list)
        setStandardCode(list[0]?.code)
      }
    })()
    return () => {
      alive = false
    }
  }, [subject, grade])

  const handleGenerate = () => {
    onGenerate({ subject, grade, standardCode, prompt })
  }
  
  const handleSave = () => {
    onSave({ subject, grade, standardCode, prompt, output })
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-500">Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border px-3 py-2">
            {subjects.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Grade</label>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full rounded-lg border px-3 py-2">
            {listGrades().map((g) => (<option key={g} value={g}>{g}</option>))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500">Standard</label>
          <select value={standardCode} onChange={(e) => setStandardCode(e.target.value)} className="w-full rounded-lg border px-3 py-2">
            {availableStandards.map((s) => (<option key={s.code} value={s.code}>{s.code} — {s.title}</option>))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500">Context / Instructions</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full min-h-[90px] rounded-lg border px-3 py-2" placeholder="Describe your class needs, reading level, etc." />
      </div>

      <div className="flex gap-2">
        <Button variant="primary" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating…' : 'Generate'}
        </Button>
        <Button onClick={() => { setPrompt(''); setOutput('')}}>Clear</Button>
        <Button onClick={handleSave} disabled={!output || isSaving} className="ml-auto">
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div>
        <label className="block text-xs text-gray-500">AI Output</label>
        <div className="min-h-[200px] rounded-lg border p-3 whitespace-pre-wrap bg-gray-50">{output || '—'}</div>
      </div>
    </div>
  )
}
