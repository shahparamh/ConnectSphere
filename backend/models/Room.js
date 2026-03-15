const mongoose = require('mongoose')

const RoomSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  isGroup: { type: Boolean, default: false },
  name: { type: String, default: null }, // for group chats
  avatar: { type: String, default: null },
  lastMessage: {
    text: String,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date,
    type: { type: String, default: 'text' },
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {},
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

// Index for fast participant lookup
RoomSchema.index({ participants: 1 })

module.exports = mongoose.model('Room', RoomSchema)
