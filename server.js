import express from 'express'
import { llm } from './basic-agent.js'

const app = express()
const port = 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/agent', async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const response = await llm.invoke(message)

    res.json({
      response: response.content,
      model: 'gemini-2.5-pro'
    })
  } catch (error) {
    console.error('Error processing agent request:', error)
    res.status(500).json({ error: 'Failed to process request' })
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})