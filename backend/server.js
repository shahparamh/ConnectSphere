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
const { registerSocketHandlers } = require('./socket/handlers')

const app    = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
})

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

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
