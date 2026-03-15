const express = require('express')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')
const { OAuth2Client } = require('google-auth-library')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'connectsphere_dev_secret'
const JWT_EXPIRE  = process.env.JWT_EXPIRE  || '7d'
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' })
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists)
      return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, passwordHash: password })
    const token = signToken(user._id)

    res.status(201).json({ token, user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' })

    const valid = await user.comparePassword(password)
    if (!valid)
      return res.status(401).json({ message: 'Invalid email or password' })

    // Update status to online
    user.status = 'online'
    await user.save({ validateBeforeSave: false })

    const token = signToken(user._id)
    res.json({ token, user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const { name, email, picture } = ticket.getPayload()

    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        avatar: picture,
        passwordHash: Math.random().toString(36).slice(-12),
        status: 'online'
      })
    } else {
      user.status = 'online'
      await user.save({ validateBeforeSave: false })
    }

    const token = signToken(user._id)
    res.json({ token, user: user.toSafeObject() })
  } catch (err) {
    res.status(401).json({ message: 'Google auth failed', error: err.message })
  }
})

// const twilio = process.env.TWILIO_ACCOUNT_SID ? require('twilio')(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// ) : null
const twilio = null // Disabled for now

// POST /api/auth/request-otp
router.post('/request-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body
    const userId = req.headers['x-user-id'] // Simplified for demo, should use auth middleware

    if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.phoneNumber = phoneNumber
    user.verificationCode = otp
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000 // 10 mins
    await user.save({ validateBeforeSave: false })

    console.log(`[Twilio - DISABLED] Sending OTP ${otp} to ${phoneNumber}`)

    // if (twilio) {
    //   await twilio.messages.create({
    //     body: `Your ConnectSphere verification code is: ${otp}`,
    //     from: process.env.TWILIO_PHONE_NUMBER,
    //     to: phoneNumber,
    //   })
    //   res.json({ success: true, message: 'OTP sent' })
    // } else {
      res.json({ 
        success: true, 
        message: 'OTP generated (Demo Mode: Twilio Disabled)',
        otp // Returning OTP in response ONLY for demo mode
      })
    // }
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message })
  }
})

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body
    const userId = req.headers['x-user-id']

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (user.verificationCode !== otp || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    user.isPhoneVerified = true
    user.verificationCode = undefined
    user.verificationCodeExpires = undefined
    await user.save({ validateBeforeSave: false })

    res.json({ success: true, message: 'Phone verified successfully', user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message })
  }
})

module.exports = router
