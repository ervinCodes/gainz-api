const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

router.post('/signup', authController.postSignup)
router.post('/login', authController.postLogin)
router.get('/logout', authController.logout)

module.exports = router