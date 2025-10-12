import React from 'react'
import { Button } from './Buttons'
import StandardsPlanner from './StandardsPlanner'


export default function Dashboard() {
const [view, setView] = React.useState<'home' | 'planner'>('home')


return (
<div className="max-w-6xl mx-auto px-4 py-6">
{view === 'home' && (
<div className="grid gap-6 md:grid-cols-2">
<section className="p-6 rounded-2xl border border-gray-200 shadow-soft">
<h3 className="text-lg font-semibold mb-2">Standards Planner</h3>
<p className="text-sm text-gray-600 mb-4">Generate assignments aligned to Florida Civics (and more), then save to Firestore.</p>
<Button onClick={() => setView('planner')}>Open Planner</Button>
</section>


<section className="p-6 rounded-2xl border border-gray-200 shadow-soft">
<h3 className="text-lg font-semibold mb-2">Resources</h3>
<p className="text-sm text-gray-600">Add more modules later (rosters, grouping, item specs, etc.).</p>
</section>
</div>
)}


{view === 'planner' && (
<StandardsPlanner onBack={() => setView('home')} />
)}
</div>
)
}
