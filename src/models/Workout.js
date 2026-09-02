const mongoose = require("mongoose");

const SetSchema = new mongoose.Schema({
    setNumber: { type: Number, required: true },
    reps: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    isChecked: { type: Boolean, default: false }
})

const ExerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ['strength', 'hypertrophy'],
        default: 'strength'
    },
    sets: { type: [SetSchema] },
    personalRecord: { type: Number, default: 0 }
})

const WorkoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: { type: String, required: true },
    exercises: [ExerciseSchema],
    completed: { type: Boolean, default: false },
    createAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Workout", WorkoutSchema);
module.exports.SetSchema = SetSchema;