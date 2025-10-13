// ... other imports
import { generateWithGemini } from '../lib/api'
// No more toast import
import GenerationPanel from './GenerationPanel'

// ... Dashboard, RosterPanel, TrackerPanel, and CardStat components are unchanged ...

/** ASSIGNMENTS */
function AssignmentsPanel({ ownerUid }: { ownerUid: string }) {
  const [output, setOutput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async (details: { /*...*/ }) => {
    setIsGenerating(true)
    try {
      const res = await generateWithGemini(details)
      setOutput(res ?? '')
    } catch (e) {
      setOutput('There was an error generating content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async (details: { /*...*/ }) => {
    if (!details.output.trim()) return
    
    setIsSaving(true)
    try {
      await addDoc(collection(db, 'assignments'), {
        ...details,
        ownerUid,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Save failed:", error)
    } 
    finally {
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
