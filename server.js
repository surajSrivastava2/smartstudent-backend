require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['*', 'https://yourusername.github.io/smartstudent-frontend']
}));
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// Simple User Model & Routes
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model('User', userSchema);

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'LIVE ✅', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = new User({ name, email, password });
        await user.save();
        res.json({ success: true, message: 'User created!', user: { name, email } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Login (simple - no JWT for demo speed)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        res.json({ success: true, user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// AI Chat (Mock OpenAI for demo)
app.post('/api/chat/ask', (req, res) => {
    const { question } = req.body;
    const mockResponses = {
        'python': 'Python functions are reusable blocks of code. def my_function():\n  print("Hello")\nmy_function()',
        'calculus': 'Calculus studies rates of change. Derivative: d/dx(x²) = 2x\nIntegral: ∫x dx = x²/2 + C',
        'default': 'Great question! Let me explain: [AI Processing...]\n\nKey points:\n• Main concept\n• Example\n• Practice tip'
    };
    
    const response = mockResponses[question.toLowerCase().includes('python') ? 'python' : 
                     question.toLowerCase().includes('calculus') ? 'calculus' : 'default'];
    
    res.json({ 
        success: true, 
        answer: response,
        question 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend LIVE on port ${PORT}`);
});
