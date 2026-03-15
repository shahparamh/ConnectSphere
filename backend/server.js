require('dotenv').config()
const express   = require('express')
const http      = require('http')
const cors      = require('cors')
const mongoose  = require('mongoose')
const { Server } = require('socket.io')

const authRoutes    = require('./routes/auth')
const userRoutes    = require('./routes/users')
const roomRoutes    = require('./routes/rooms')
const locationRoutes = require('./routes/location')
const aiRoutes       = require('./routes/ai')
const uploadRoutes   = require('./routes/upload')
const { registerSocketHandlers } = require('./socket/handlers')
const path = require('path')

const app    = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://connectsphere-tawny.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 1e8 // 100MB
})

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://connectsphere-tawny.vercel.app'
  ],
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/upload', uploadRoutes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/users',    userRoutes)
app.use('/api/rooms',    roomRoutes)
app.use('/api/location', locationRoutes)
app.use('/api/ai',       aiRoutes)

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }))

// ── Socket.IO ───────────────────────────────────────────
registerSocketHandlers(io)

// ── MongoDB ─────────────────────────────────────────────
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/connectsphere'

mongoose.connect(MONGO_URL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.warn('⚠️  MongoDB not connected (running in demo mode):', err.message)
  })

// ── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 ConnectSphere server running on http://localhost:${PORT}`)
})
