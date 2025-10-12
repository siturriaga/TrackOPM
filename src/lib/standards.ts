export type ItemSpecs = {
  cognitiveComplexity?: string
  stimulusTypes?: string[]
  contentLimits?: string
  taskDemand?: string[]
}

export type Benchmark = { id: string; text: string }

export type Standard = {
  code: string
  label: string
  benchmarks?: Benchmark[]
  itemSpecs?: ItemSpecs
}

export type SubjectStandards = {
  subject: string
  grade: string
  standards: Standard[]
}

export type StandardsIndexEntry = { id: string; label: string; path: string }

export async function loadStandardsIndex(): Promise<StandardsIndexEntry[]> {
  const res = await fetch('/data/standards/index.json')
  if (!res.ok) throw new Error('Failed to load standards index')
  return res.json()
}

export async function loadSubject(path: string): Promise<SubjectStandards> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load standards file: ${path}`)
  return res.json()
}
