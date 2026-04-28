export async function analyzeEntry(title: string, mood: string, content: string) {
  try {
    const prompt = `<s>[INST] You are a compassionate AI journaling assistant.

Analyze this journal entry carefully and return ONLY a JSON object. No explanation, no markdown, no extra text.

Journal Entry:
- Title: ${title}
- Mood reported by user: ${mood}
- Content: ${content}

Rules:
- sentiment must be "positive" if mood is happy or content sounds good
- sentiment must be "negative" if mood is sad or stressed or content sounds difficult  
- sentiment must be "neutral" only if mood is neutral and content is balanced
- summary must be 1-2 sentences describing what the person wrote about
- reflection must be 2-3 warm encouraging sentences as advice for the person

Return this exact JSON format:
{"sentiment":"positive","summary":"your summary here","reflection":"your reflection here"} [/INST]`

    const res = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 400,
            temperature: 0.3,
            return_full_text: false,
            do_sample: true,
          }
        })
      }
    )

    const data = await res.json()
    console.log('HF raw response:', data)

    const raw = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text
    if (!raw) throw new Error('No response from AI')

    console.log('Raw text:', raw)

    // Try to extract JSON
    const jsonMatch = raw.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Fix sentiment based on mood if AI got it wrong
      if (!['positive', 'negative', 'neutral'].includes(parsed.sentiment)) {
        parsed.sentiment = moodToSentiment(mood)
      }

      return parsed
    }

    throw new Error('No JSON found in response')

  } catch (e) {
    console.error('HF AI failed, using smart fallback:', e)
    return smartFallback(title, mood, content)
  }
}

// Map mood to correct sentiment
function moodToSentiment(mood: string): string {
  const map: Record<string, string> = {
    happy: 'positive',
    sad: 'negative',
    stressed: 'negative',
    neutral: 'neutral',
  }
  return map[mood] || 'neutral'
}

// Smart fallback with real varied responses
function smartFallback(title: string, mood: string, content: string) {
  const wordCount = content.split(' ').length
  const sentiment = moodToSentiment(mood)

  const reflections: Record<string, string[]> = {
    happy: [
      'What a wonderful moment to capture! Happiness like this is worth remembering on harder days. Keep nurturing the things and people that bring you this joy.',
      'It\'s beautiful that you took time to document this positive experience. Let this feeling remind you of what truly matters in your life.',
      'Your happiness shines through your words! Use this positive energy to fuel your goals and share your joy with those around you.',
    ],
    sad: [
      'It takes courage to write about difficult feelings. Remember that sadness is temporary and every storm eventually passes. Be kind to yourself today.',
      'Thank you for being honest with yourself through writing. Sit with your feelings without judgment — healing begins with acknowledgment.',
      'Hard days make us stronger. Reach out to someone you trust, take things one step at a time, and remember you don\'t have to face this alone.',
    ],
    stressed: [
      'Stress is a sign you care deeply. Try breaking your challenges into smaller steps and tackle them one at a time. You are more capable than you think.',
      'Take a deep breath — you\'ve handled difficult situations before and you will handle this too. Writing it down is a great first step to clearing your mind.',
      'When stress feels overwhelming, step back and ask: what is the one thing I can control right now? Focus there and let the rest follow.',
    ],
    neutral: [
      'Calm, reflective days like this are perfect for gaining clarity. Use this balanced mindset to think about what you want to achieve next.',
      'There is quiet strength in a neutral day. Sometimes just showing up and writing is the most important thing you can do for yourself.',
      'A steady mind is a powerful tool. Take advantage of this calm to plan, dream, or simply appreciate the peace of an ordinary day.',
    ],
  }

  const summaries: Record<string, string> = {
    happy: `You captured a happy moment about "${title}" in ${wordCount} words. Your entry radiates positivity and gratitude.`,
    sad: `You processed some difficult feelings about "${title}" in ${wordCount} words. Writing through sadness shows real self-awareness.`,
    stressed: `You expressed stress around "${title}" in ${wordCount} words. Putting your worries into words is a healthy way to process them.`,
    neutral: `You reflected on "${title}" in ${wordCount} words with a calm and balanced perspective.`,
  }

  const moodReflections = reflections[mood] || reflections.neutral
  const randomReflection = moodReflections[Math.floor(Math.random() * moodReflections.length)]

  return {
    sentiment,
    summary: summaries[mood] || summaries.neutral,
    reflection: randomReflection,
  }
}