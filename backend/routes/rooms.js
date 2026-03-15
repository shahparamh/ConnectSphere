const express  = require('express')
const auth     = require('../middleware/auth')
const User     = require('../models/User')
const Room     = require('../models/Room')
const Message  = require('../models/Message')

const router = express.Router()

// GET /api/rooms – get all rooms for current user
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ participants: req.user.id })
      .populate('participants', 'name email avatar status')
      .sort({ updatedAt: -1 })
    res.json(rooms)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/rooms – create or get existing DM room
router.post('/', auth, async (req, res) => {
  try {
    const { participantId } = req.body
    const me = req.user.id

    let room = await Room.findOne({
      participants: { $all: [me, participantId], $size: 2 },
      isGroup: false,
    })

    if (!room) {
      room = await Room.create({ participants: [me, participantId] })
    }

    await room.populate('participants', 'name email avatar status')
    res.json(room)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/rooms/:id/messages
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const messages = await Message.find({
      roomId: req.params.id,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('senderId', 'name avatar')

    res.json(messages.reverse())
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
