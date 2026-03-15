const express = require('express')
const router = express.Router()
const axios = require('axios')

router.post('/chat', async (req, res) => {
  const { message, history, context } = req.body
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API Key not configured on server' })
  }

  const systemPrompt = `You are Connectsphere AI, a helpful and friendly assistant integrated into a social safety and location sharing app. 
Your goal is to help users navigate the app, understand its features (like SOS, location sharing, and circles), and provide general assistance.
Keep responses concise and use emojis where appropriate.

Below is context about the user's other ongoing chats in the app. Use this to answer questions about other contacts if asked:
${context || 'No other chats available.'}`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []),
    { role: 'user', content: message }
  ]

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const aiText = response.data.choices[0].message.content
    res.json({ text: aiText })
  } catch (err) {
    console.error('Backend Groq Error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to get AI response' })
  }
})

module.exports = router
