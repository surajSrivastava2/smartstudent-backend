require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB:', err));

// User Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// 🚀 LIVE APIs
app.get('/api/health', (req, res) => res.json({ 
  status: 'LIVE ✅', 
  ai: 'GPT-4o-mini',
  timestamp: new Date().toISOString()
}));

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    res.json({ success: true, user: { name, email } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid login' });
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🤖 REAL OpenAI GPT-4o-mini Chat
app.post('/api/chat/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // FAST + CHEAP ($0.15/1M tokens)
      messages: [
        {
          role: "system",
          content: "You are SmartStudent AI - professional academic assistant for engineering students (L&T). Answer concisely with code examples, formulas, and study tips. Use emojis and structured format."
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const answer = completion.choices[0].message.content;

    res.json({ 
      success: true, 
      answer,
      question,
      model: "GPT-4o-mini",
      tokens: completion.usage.total_tokens
    });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'AI service temporarily unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Notes AI Summary
app.post('/api/notes/upload', async (req, res) => {
  try {
    const { content } = req.body;  // Frontend sends text
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "SmartStudent AI Notes Summarizer. Create bullet-point summary with key formulas, concepts, and 3 practice questions. Engineering student level."
        },
        {
          role: "user",
          content: `Summarize these notes:\n\n${content.substring(0, 4000)}`
        }
      ]
    });

    res.json({
      success: true,
      summary: completion.choices[0].message.content,
      model: "GPT-4o-mini"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Summary failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SmartStudent GPT-4 LIVE on ${PORT}`);
});
