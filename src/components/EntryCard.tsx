interface Insight { sentiment: string; summary: string; reflection: string }
interface Entry {
  id: string; title: string; content: string; mood: string;
  created_at: string; ai_loading?: boolean; insight?: Insight | null
}

const moodEmoji: Record<string,string> = { happy:'😊', sad:'😔', neutral:'😐', stressed:'😤' }
const moodColor: Record<string,string> = {
  happy:   'bg-amber-50 text-amber-700 border-l-amber-500',
  sad:     'bg-blue-50 text-blue-700 border-l-blue-500',
  neutral: 'bg-stone-100 text-stone-500 border-l-stone-400',
  stressed:'bg-rose-50 text-rose-700 border-l-rose-500',
}

export default function EntryCard({ entry, onClick }: { entry: Entry; onClick: () => void }) {
  const preview = entry.content.length > 110 ? entry.content.slice(0, 110) + '…' : entry.content
  const date = new Date(entry.created_at).toLocaleDateString('en-GB', {
    weekday:'short', day:'numeric', month:'long', year:'numeric'
  })

  return (
    <div onClick={onClick}
      className={`bg-white border border-stone-200 border-l-4 ${moodColor[entry.mood]} rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all`}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-serif text-base font-medium leading-snug">{entry.title}</h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${moodColor[entry.mood]}`}>
          {moodEmoji[entry.mood]} {entry.mood.charAt(0).toUpperCase()+entry.mood.slice(1)}
        </span>
      </div>
      <p className="text-xs text-stone-400 mb-2">{date}</p>
      <p className="text-sm text-stone-400 leading-relaxed mb-2">{preview}</p>

      {entry.ai_loading && (
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="flex gap-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full bg-stone-400 animate-bounce"
                style={{animationDelay:`${i*0.15}s`}} />
            ))}
          </span>
          Generating insights…
        </div>
      )}
      {!entry.ai_loading && entry.insight && (
        <>
          <p className="text-sm text-stone-600 italic border-l-2 border-stone-200 pl-3 mb-2">{entry.insight.summary}</p>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">✨ AI insights ready</span>
        </>
      )}
    </div>
  )
}