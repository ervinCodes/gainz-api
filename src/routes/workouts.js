const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const { ensureAuth } = require('../middleware/auth');

router.post('/create', ensureAuth, workoutController.createWorkout);
router.get('/', ensureAuth, workoutController.getWorkouts);
router.get('/:id', ensureAuth, workoutController.getWorkoutById);
router.delete('/:id', ensureAuth, workoutController.deleteWorkout);

module.exports = router;