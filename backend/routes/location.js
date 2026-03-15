const express = require('express')
const auth    = require('../middleware/auth')
const User    = require('../models/User')

const router = express.Router()

// POST /api/location/share – start sharing location
router.post('/share', auth, async (req, res) => {
  try {
    const { lat, lng, accuracy, durationMinutes, sharedWith } = req.body
    const expiresAt = new Date(Date.now() + (durationMinutes || 30) * 60 * 1000)

    await User.findByIdAndUpdate(req.user.id, {
      location: { lat, lng, accuracy, updatedAt: new Date() },
      locationSharing: { active: true, expiresAt, sharedWith: sharedWith || [] },
    })

    res.json({ success: true, expiresAt })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/location/stop – stop sharing
router.post('/stop', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      'locationSharing.active': false,
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/location/contacts – get locations of contacts sharing with me
router.get('/contacts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('contacts')
    const sharing = user.contacts.filter(c =>
      c.locationSharing?.active &&
      c.locationSharing?.expiresAt > new Date() &&
      c.locationSharing?.sharedWith?.some(id => id.toString() === req.user.id)
    )
    res.json(sharing.map(c => ({
      userId: c._id,
      name: c.name,
      location: c.location,
      expiresAt: c.locationSharing.expiresAt,
    })))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/location/sos – send SOS alert
router.post('/sos', auth, async (req, res) => {
  try {
    const { location, message } = req.body
    const user = await User.findById(req.user.id).populate('emergencyContacts', 'name email')

    // In production: send push notifications / SMS to emergency contacts
    console.log(`🆘 SOS from ${user.name}`, { location, contacts: user.emergencyContacts })

    // Update user location
    if (location) {
      await User.findByIdAndUpdate(req.user.id, {
        location: { ...location, updatedAt: new Date() },
      })
    }

    res.json({
      success: true,
      notified: user.emergencyContacts.length,
      message: `SOS sent to ${user.emergencyContacts.length} emergency contact(s)`,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
