const express = require('express')
const auth    = require('../middleware/auth')
const User    = require('../models/User')

const router = express.Router()

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user.toSafeObject())
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/users/me
router.put('/me', auth, async (req, res) => {
  try {
    const { name, avatar, status, bio, settings, emergencyContacts } = req.body
    const update = {}
    if (name) update.name = name
    if (avatar !== undefined) update.avatar = avatar
    if (status) update.status = status
    if (bio !== undefined) update.bio = bio
    if (settings) update.settings = settings
    if (emergencyContacts) update.emergencyContacts = emergencyContacts

    const user = await User.findByIdAndUpdate(
      req.user.id,
      update,
      { new: true, runValidators: true }
    )
    res.json(user.toSafeObject())
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/users/find/:phone
router.get('/find/:phone', auth, async (req, res) => {
  try {
    const user = await User.findOne({ phoneNumber: req.params.phone })
    if (!user) return res.status(404).json({ message: 'User not found with this mobile number' })
    res.json(user.toSafeObject())
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/users/contacts
router.get('/contacts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('contacts', 'name email avatar status location')
    res.json(user.contacts)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
