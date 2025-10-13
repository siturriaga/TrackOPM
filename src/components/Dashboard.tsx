import React, { useEffect, useMemo, useState } from 'react'
import { Button } from './Buttons'
import { useAuth } from './AuthGate'
import { db } from '../lib/firebase'
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where, doc, deleteDoc } from 'firebase/firestore'
import { generateWithGemini } from '../lib/api'
import toast from 'react-hot-toast'
import GenerationPanel from './GenerationPanel'

type Student = { id?: string; name: string; period?: string; level?: string; tags?: string; notes?: string; ownerUid: string; createdAt?: any }
type Assignment = { id?: string; subject: string; grade: string; standardCode?: string; prompt: string; output?: string; ownerUid: string; createdAt?: any }

export default function Dashboard() {
  const user = useAuth()!
  const [activeTab, setActiveTab] = useState<'Roster' | 'Tracker' | 'Assignments'>('Roster')

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['Roster','Tracker','Assignments'] as const).map(t => (
          <Button key={t} variant={activeTab === t ? 'primary' : 'secondary'} onClick={() => setActiveTab(t)}>{t}</Button>
        ))}
      </div>
      {activeTab === 'Roster' && <RosterPanel ownerUid={user.uid} />}
      {activeTab === 'Tracker' && <TrackerPanel ownerUid={user.uid} />}
      {activeTab === 'Assignments' && <AssignmentsPanel ownerUid={user.uid} />}
    </div>
  )
}

/** ROSTER */
function RosterPanel({ ownerUid }: { ownerUid: string }) {
  // This component's code is unchanged
  const [students, setStudents] = useState<Student[]>([])
  const [name, setName] = useState('')
  const [period, setPeriod] = useState('')
  const [level, setLevel] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'students'), where('ownerUid', '==', ownerUid), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const rows: Student[] = []
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }))
      setStudents(rows)
    })
    return () => unsub()
  }, [ownerUid])

  async function addStudent() {
    if (!name.trim()) return
    await addDoc(collection(db, 'students'), { name, period, level, ownerUid, createdAt: serverTimestamp() })
    setName(''); setPeriod(''); setLevel('')
  }

  async function removeStudent(id?: string) {
    if (!id) return
    await deleteDoc(doc(db, 'students', id))
  }

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur p-5 shadow">
      <div className="flex items-end gap-2">
        <div className="grow">
          <label className="block text-xs text-gray-500">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="Student name" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Period</label>
          <input value={period} onChange={e=>setPeriod(e.target.value)} className="w-28 rounded-lg border px-3 py-2" placeholder="1" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Level</label>
          <input value={level} onChange={e=>setLevel(e.target.value)} className="w-28 rounded-lg border px-3 py-2" placeholder="Proficient" />
        </div>
        <Button variant="primary" onClick={addStudent}>Add</Button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Name</th>
              <th>Period</th>
              <th>Level</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-t">
                <td className="py-2">{s.name}</td>
                <td>{s.period ?? <span className="text-brandGold">N/A</span>}</td>
                <td>{s.level ?? <span className="text-brandGold">N/A</span>}</td>
                <td className="text-right">
                  <Button variant="ghost" onClick={() => removeStudent(s.id)}>Remove</Button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td className="py-6 text-gray-500" colSpan={4}>No students yet — add a few to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** TRACKER */
function TrackerPanel({ ownerUid }: { ownerUid: string }) {
  // This component's code is unchanged
  const [count, setCount] = useState(0)
  const [studentsCount, setStudentsCount] = useState(0)

  useEffect(() => {
    const q = query(collection(db, 'students'), where('ownerUid', '==', ownerUid))
    const unsub = onSnapshot(q, (snap) => setStudentsCount(snap.size))
    return () => unsub()
  }, [ownerUid])

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur p-5 shadow">
      <h3 className="font-display text-lg">Class Overview</h3>
      <p className="text-gray-600 text-sm">Quick snapshot of class activity.</p>
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <CardStat title="Students" value={studentsCount} />
        <CardStat title="Completed Tasks (demo)" value={count} />
        <CardStat title="Goals Met (demo)" value={Math.floor(count / 3)} />
      </div>
      <div className="mt-6">
        <Button variant="primary" onClick={() => setCount(c => c + 1)}>Mark a Task Complete</Button>
      </div>
    </div>
  )
}

function CardStat({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}

/** ASSIGNMENTS */
function AssignmentsPanel({ ownerUid }: { ownerUid: string }) {
  const [output, setOutput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async (details: { subject: string; grade: string; standardCode?: string; prompt: string }) => {
    setIsGenerating(true)
    try {
      const res = await generateWithGemini(details)
      setOutput(res ?? '')
    } catch (e) {
      setOutput('There was an error generating content. Please try again.')
      toast.error('Generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async (details: { subject: string; grade: string; standardCode?: string; prompt: string; output: string }) => {
    if (!details.output.trim()) return
    
    const saveData = addDoc(collection(db, 'assignments'), {
      ...details,
      ownerUid,
      createdAt: serverTimestamp(),
    } as Assignment)

    toast.promise(saveData, {
      loading: 'Saving assignment...',
      success: 'Assignment saved successfully!',
      error: 'Could not save assignment.',
    })

    setIsSaving(true)
    try {
      await saveData
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur p-5 shadow">
      <GenerationPanel
        onGenerate={handleGenerate}
        onSave={handleSave}
        isGenerating={isGenerating}
        isSaving={isSaving}
        output={output}
        setOutput={setOutput}
      />
    </div>
  )
}
