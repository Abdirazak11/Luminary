import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { analyzeEntry } from '../api/analyze'
import JournalForm from '../components/JournalForm'
import EntryCard from '../components/EntryCard'

interface Insight { sentiment: string; summary: string; reflection: string }
interface Entry {
  id: string; title: string; content: string; mood: string;
  created_at: string; ai_loading?: boolean; insight?: Insight | null
}

const moodEmoji: Record<string,string> = { happy:'😊', sad:'😔', neutral:'😐', stressed:'😤' }
const sentColor: Record<string,string> = {
  positive: 'bg-emerald-50 text-emerald-700',
  negative: 'bg-rose-50 text-rose-700',
  neutral:  'bg-stone-100 text-stone-500'
}

export default function Dashboard() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [detail, setDetail] = useState<Entry | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    loadEntries()
  }, [])

  async function loadEntries() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: ents } = await supabase
      .from('journal_entries').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    if (!ents) return
    const { data: ins } = await supabase.from('ai_insights').select('*')
    const merged = ents.map(e => ({ ...e, insight: ins?.find(i => i.entry_id === e.id) ?? null }))
    setEntries(merged)
  }

  async function handleSubmit(title: string, content: string, mood: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: entry } = await supabase
      .from('journal_entries').insert({ user_id: user.id, title, content, mood }).select().single()
    if (!entry) return
    const newEntry = { ...entry, ai_loading: true, insight: null }
    setEntries(prev => [newEntry, ...prev])
    setShowForm(false)
    try {
      const insight = await analyzeEntry(title, mood, content)
      await supabase.from('ai_insights').insert({ entry_id: entry.id, ...insight })
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ai_loading: false, insight } : e))
    } catch (e) {
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ai_loading: false } : e))
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('journal_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDetail(null)
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="bg-white border-b border-stone-200 px-5 h-14 flex items-center justify-between sticky top-0 z-10">
        <span className="font-serif text-xl text-amber-800">✏ Luminary</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-400">{user?.email}</span>
          <button onClick={() => supabase.auth.signOut()}
            className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-500 hover:bg-stone-50">
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl">My Journal</h1>
          <button onClick={() => setShowForm(true)}
            className="bg-amber-800 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-amber-900 flex items-center gap-1.5">
            <span className="text-lg leading-none">+</span> New Entry
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-4xl mb-3">📖</div>
            <p className="italic text-sm">No entries yet.<br />Tap + New Entry to write your first one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(e => <EntryCard key={e.id} entry={e} onClick={() => setDetail(e)} />)}
          </div>
        )}
      </div>

      {showForm && <JournalForm onSubmit={handleSubmit} onClose={() => setShowForm(false)} />}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetail(null)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setDetail(null)}
                className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-500 hover:bg-stone-50">← Back</button>
              <button onClick={() => deleteEntry(detail.id)}
                className="text-sm border border-red-200 rounded-lg px-3 py-1.5 text-red-500 hover:bg-red-50">Delete</button>
            </div>
            <p className="text-xs text-stone-400 mb-2">
              {new Date(detail.created_at).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'long',year:'numeric'})}
            </p>
            <h2 className="font-serif text-xl mb-3">{detail.title}</h2>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-700 mb-4">
              {moodEmoji[detail.mood]} {detail.mood.charAt(0).toUpperCase()+detail.mood.slice(1)}
            </span>
            <p className="text-sm leading-relaxed text-stone-600 font-serif italic whitespace-pre-wrap mb-6">{detail.content}</p>

            <div className="border-t border-stone-100 pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-3">✨ AI Insights</p>
              {detail.ai_loading ? (
                <p className="text-sm text-stone-400 italic">Analysing your entry…</p>
              ) : detail.insight ? (
                <div className="space-y-3">
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Sentiment</p>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${sentColor[detail.insight.sentiment]}`}>
                      {detail.insight.sentiment === 'positive' ? '🌟' : detail.insight.sentiment === 'negative' ? '🌧️' : '☁️'}{' '}
                      {detail.insight.sentiment.charAt(0).toUpperCase()+detail.insight.sentiment.slice(1)}
                    </span>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Summary</p>
                    <p className="text-sm text-stone-700 leading-relaxed">{detail.insight.summary}</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Reflection for you</p>
                    <p className="text-sm text-stone-700 leading-relaxed">{detail.insight.reflection}</p>
                  </div>
                </div>
              ) : <p className="text-sm text-stone-400 italic">No insights available.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}