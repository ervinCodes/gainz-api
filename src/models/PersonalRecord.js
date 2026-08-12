const mongoose = require('mongoose');

const LastWorkoutSchema = new mongoose.Schema({
    sets: [{
        reps: { type: Number, default: 0},
        weight: { type: Number, default: 0}
    }],
    date: { type: Date, default: null }
}, {_id: false })

const PersonalRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exerciseName: {
        type: String,
        required: true
    },
    topSet: {
        type: Number,
        required: true,
    },
    dateAchieved: {
        type: Date,
        default: Date.now
    },
    lastWorkout: {
        strength: { type: LastWorkoutSchema, default: null},
        hypertrophy: {type: LastWorkoutSchema, default: null}
    }
});

module.exports = mongoose.model('PersonalRecord', PersonalRecordSchema)