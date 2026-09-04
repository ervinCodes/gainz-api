const express = require('express')
const router = express.Router()
const exerciseController = require('../controllers/exerciseController')
const { ensureAuth } = require('../middleware/auth')

router.get('/', ensureAuth, exerciseController.getExercises)
router.get('/bodyparts', ensureAuth, exerciseController.getBodyParts)
router.get('/search', ensureAuth, exerciseController.searchExercises)
router.post('/custom', ensureAuth, exerciseController.addCustomExercise)
router.get('/custom', ensureAuth, exerciseController.getCustomExercises)

module.exports = router