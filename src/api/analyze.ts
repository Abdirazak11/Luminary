export async function analyzeEntry(title: string, mood: string, content: string) {
  try {
    const res = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `<s>[INST] You are a compassionate AI journaling assistant. Analyse this journal entry and respond ONLY with raw JSON, no extra text, no markdown.

Title: ${title}
Mood: ${mood}
Content: ${content}

Respond with exactly this JSON:
{"sentiment":"positive|neutral|negative","summary":"1-2 sentence summary of the entry","reflection":"2-3 sentence warm helpful suggestion"} [/INST]`,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            return_full_text: false,
          }
        })
      }
    )

    const data = await res.json()

    // Extract the generated text
    const raw = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text
    if (!raw) throw new Error('No response from AI')

    // Find JSON in the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse AI response')

    return JSON.parse(jsonMatch[0])

  } catch (e) {
    console.error('AI analysis failed:', e)
    // Return a default insight so the app doesn't break
    return {
      sentiment: 'neutral',
      summary: 'Your journal entry has been saved successfully.',
      reflection: 'Take a moment to reflect on what you wrote today. Journaling is a powerful habit for self-growth.'
    }
  }
}