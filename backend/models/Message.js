const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    default: '',
    maxlength: 4000,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'location', 'file', 'system'],
    default: 'text',
  },
  // For location messages
  location: {
    lat: Number,
    lng: Number,
  },
  // For file/image messages
  fileUrl: String,
  fileName: String,
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: Date,
  }],
  deletedAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('Message', MessageSchema)
