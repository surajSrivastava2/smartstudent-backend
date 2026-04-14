require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const OpenAI = require('openai');

const app = express();

// Middleware (UNCHANGED)
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// OpenAI (UNCHANGED)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ------------------- MONGODB FIX (ONLY IMPORTANT CHANGE) -------------------
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000
})
.then(() => {
  console.log('✅ MongoDB Connected');

  // START SERVER ONLY AFTER DB CONNECTS (FIX FOR BUFFERING TIMEOUT ISSUE)
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 GPT-4 LIVE on ${PORT}`));

})
.catch(err => {
  console.log('❌ MongoDB Error:', err);
});

// ------------------- SCHEMA -------------------
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model('User', userSchema);

// ------------------- ROUTES -------------------

// HEALTH CHECK (UNCHANGED)
app.get('/api/health', (req, res) =>
  res.json({ status: 'LIVE ✅', ai: 'GPT-4o-mini' })
);

// REGISTER (ONLY SAFE VALIDATION ADDED)
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Missing fields'
      });
    }

    const user = new User(req.body);
    await user.save();

    res.json({
      success: true,
      user: { name: user.name, email: user.email }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// LOGIN (ONLY FIXED QUERY SAFETY)
app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
      password: req.body.password
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login'
      });
    }

    res.json({
      success: true,
      user: { name: user.name, email: user.email }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// AI ROUTE (UNCHANGED)
app.post('/api/chat/ask', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "SmartStudent AI for L&T engineers." },
        { role: "user", content: req.body.question }
      ],
      max_tokens: 800
    });

    res.json({
      success: true,
      answer: completion.choices[0].message.content
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AI Error'
    });
  }
});
