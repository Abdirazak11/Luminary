import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(20, 'Write at least 20 characters').max(3000),
})

type FormData = z.infer<typeof schema>

const moods = [
  { key: 'happy',    emoji: '😊', label: 'Happy'   },
  { key: 'sad',      emoji: '😔', label: 'Sad'     },
  { key: 'neutral',  emoji: '😐', label: 'Neutral' },
  { key: 'stressed', emoji: '😤', label: 'Stressed'},
]

interface Props {
  onSubmit: (title: string, content: string, mood: string) => Promise<void>
  onClose: () => void
}

export default function JournalForm({ onSubmit, onClose }: Props) {
  const [mood, setMood] = useState('')
  const [moodError, setMoodError] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const contentLen = watch('content')?.length ?? 0

  async function submit(data: FormData) {
    if (!mood) { setMoodError(true); return }
    setMoodError(false)
    setLoading(true)
    await onSubmit(data.title, data.content, mood)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative bg-stone-50 rounded-t-2xl p-6 w-full max-w-xl max-h-[88vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl">New Entry</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-300">✕</button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Title *</label>
            <input {...register('title')} placeholder="Give this entry a title…"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Mood *</label>
            <div className="flex gap-2 flex-wrap">
              {moods.map(m => (
                <button type="button" key={m.key} onClick={() => { setMood(m.key); setMoodError(false) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all
                    ${mood === m.key ? 'border-amber-600 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-500 hover:border-amber-300'}`}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
            {moodError && <p className="text-red-500 text-xs mt-1">Please select a mood</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Content *</label>
            <textarea {...register('content')} rows={5} placeholder="Write freely… what's on your mind today?"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white resize-y" />
            <div className="flex justify-between items-center mt-1">
              {errors.content ? <p className="text-red-500 text-xs">{errors.content.message}</p> : <span />}
              <span className="text-xs text-stone-400">{contentLen}/3000</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-100">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 rounded-lg bg-amber-800 text-white text-sm font-medium hover:bg-amber-900 disabled:opacity-50 flex items-center gap-2">
              {loading && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {loading ? 'Saving…' : 'Save & Analyse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}