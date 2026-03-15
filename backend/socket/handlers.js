const jwt     = require('jsonwebtoken')
const Message = require('../models/Message')
const Room    = require('../models/Room')
const User    = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'connectsphere_dev_secret'

// Map: userId → socketId
const onlineUsers = new Map()

const registerSocketHandlers = (io) => {

  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.userId = decoded.id
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.userId
    console.log(`🔌 User connected: ${userId}`)

    // Track online users
    onlineUsers.set(userId, socket.id)

    // Mark user online
    try {
      await User.findByIdAndUpdate(userId, { status: 'online' })
    } catch {}
    io.emit('user-online', { userId })

    // ── Join room ──────────────────────────────────
    socket.on('join-room', (roomId) => {
      socket.join(roomId)
      console.log(`📁 ${userId} joined room ${roomId}`)
    })

    // ── Send message ───────────────────────────────
    socket.on('send-message', async ({ roomId, message }) => {
      try {
        const msg = await Message.create({
          roomId,
          senderId: userId,
          text: message.text || '',
          type: message.type || 'text',
          location: message.location || undefined,
          status: 'sent',
        })

        // Update room's lastMessage
        await Room.findByIdAndUpdate(roomId, {
          lastMessage: {
            text: msg.text || (msg.type === 'location' ? 'Location shared' : msg.type),
            senderId: userId,
            timestamp: msg.createdAt,
            type: msg.type,
          },
          updatedAt: new Date(),
        })

        // Populate sender before broadcasting
        await msg.populate('senderId', 'name avatar')

        // Broadcast to room except sender
        socket.to(roomId).emit('receive-message', {
          roomId,
          message: {
            _id: msg._id,
            text: msg.text,
            type: msg.type,
            location: msg.location,
            timestamp: msg.createdAt,
            status: 'delivered',
            sender: msg.senderId,
          },
        })

        // Confirm delivery to sender
        socket.emit('message-sent', { tempId: message.tempId, messageId: msg._id, roomId })
      } catch (err) {
        socket.emit('message-error', { error: err.message })
      }
    })

    // ── Message Status Updates ─────────────────────
    socket.on('message-delivered', async ({ messageId, roomId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: 'delivered' })
        socket.to(roomId).emit('message-status', { roomId, messageId, status: 'delivered' })
      } catch {}
    })

    socket.on('mark-read', async ({ roomId, messageIds }) => {
      try {
        if (!messageIds || messageIds.length === 0) return
        await Message.updateMany({ _id: { $in: messageIds } }, { status: 'read' })
        socket.to(roomId).emit('messages-read', { roomId, messageIds, status: 'read' })
      } catch {}
    })

    // ── Typing indicators ──────────────────────────
    socket.on('typing', ({ roomId }) => {
      socket.to(roomId).emit('typing', { roomId, userId })
    })

    socket.on('stop-typing', ({ roomId }) => {
      socket.to(roomId).emit('stop-typing', { roomId, userId })
    })

    // ── Live location update ───────────────────────
    socket.on('location-update', async ({ lat, lng, accuracy, sharedWith }) => {
      try {
        await User.findByIdAndUpdate(userId, {
          location: { lat, lng, accuracy, updatedAt: new Date() },
        })
        // Broadcast to specified users
        sharedWith?.forEach(contactId => {
          const socketId = onlineUsers.get(contactId)
          if (socketId) {
            io.to(socketId).emit('contact-location', { userId, lat, lng, accuracy })
          }
        })
      } catch {}
    })

    // ── SOS Alert ─────────────────────────────────
    socket.on('sos-alert', async ({ location, contacts }) => {
      console.log(`🆘 SOS from ${userId}`, location)
      contacts?.forEach(contactId => {
        const socketId = onlineUsers.get(contactId)
        if (socketId) {
          io.to(socketId).emit('sos-received', {
            from: userId, location,
            timestamp: new Date(),
          })
        }
      })
    })

    // ── Disconnect ─────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${userId}`)
      onlineUsers.delete(userId)
      try {
        await User.findByIdAndUpdate(userId, { status: 'offline' })
      } catch {}
      io.emit('user-offline', { userId })
    })
  })
}

module.exports = { registerSocketHandlers }
