type StandardItem = { code: string; title: string }

export function listSubjects() {
  // Adjust if you have more subjects in /public/data/standards
  return ['Civics', 'ELA', 'Math', 'US History']
}

export function listGrades() {
  // Based on your uploaded files
  return ['6', '7', '8']
}

export async function listStandardsFor(subject: string, grade: string): Promise<StandardItem[]> {
  // Map subject+grade → file names you listed
  const map: Record<string, string> = {
    'Civics:7': '/data/standards/civics.7.json',
    'ELA:6': '/data/standards/ela.6.json',
    'ELA:7': '/data/standards/ela.7.json',
    'ELA:8': '/data/standards/ela.8.json',
    'Math:7': '/data/standards/math.7.json',
    'Math:8': '/data/standards/math.8.json',
    'US History:6': '/data/standards/us_history.6.json',
  }
  const key = `${subject}:${grade}`
  const url = map[key]
  if (!url) return []

  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  // Expecting items shaped like { code, title, ... }
  const arr: StandardItem[] = Array.isArray(json)
    ? json.map((x: any) => ({ code: x.code ?? x.standard ?? 'STD', title: x.title ?? x.description ?? 'Standard' }))
    : Object.values(json).map((x: any) => ({ code: x.code ?? x.standard ?? 'STD', title: x.title ?? x.description ?? 'Standard' }))
  return arr
}
