const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 80,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  avatar: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: 'Staying connected, staying safe 🛡️',
    maxlength: 120,
  },
  status: {
    type: String,
    enum: ['online', 'away', 'offline', 'busy', 'invisible'],
    default: 'offline',
  },
  settings: {
    privacy: {
      lastSeen:     { type: String, default: 'everyone' },
      profilePhoto: { type: String, default: 'contacts' },
      onlineStatus: { type: String, default: 'everyone' },
      readReceipts: { type: Boolean, default: true },
      twoFA:        { type: Boolean, default: false },
    },
    notifications: {
      messages:    { type: Boolean, default: true },
      sos:         { type: Boolean, default: true },
      locationReq: { type: Boolean, default: true },
      groupAlerts: { type: Boolean, default: true },
      sounds:      { type: Boolean, default: true },
      vibration:    { type: Boolean, default: true },
      emailDigest: { type: Boolean, default: false },
      quietHours:  { type: Boolean, default: false },
    },
    appearance: {
      theme:    { type: String, default: 'system' },
      fontSize: { type: String, default: 'medium' },
      accentIdx: { type: Number, default: 0 },
    },
    location: {
      allowAll:        { type: Boolean, default: true },
      trustedOnly:     { type: Boolean, default: false },
      shareWithGroups: { type: Boolean, default: true },
      showOnMap:       { type: Boolean, default: true },
      preciseLocation: { type: Boolean, default: true },
      defaultDuration: { type: String, default: '1h' },
    },
  },
  location: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    updatedAt: Date,
  },
  locationSharing: {
    active: { type: Boolean, default: false },
    expiresAt: Date,
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  emergencyContacts: [{
    id: String,
    name: String,
    phone: String,
    initials: String,
    color: String,
    isOnline: { type: Boolean, default: false },
    perms: [String]
  }],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  next()
})

UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  return obj
}

module.exports = mongoose.model('User', UserSchema)
