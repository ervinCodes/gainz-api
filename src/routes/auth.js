const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { ensureAuth } = require('../middleware/auth')

router.post('/signup', authController.postSignup)
router.post('/login', authController.postLogin)
router.get('/logout', authController.logout)
router.get('/profile', ensureAuth, authController.getProfile)

module.exports = router