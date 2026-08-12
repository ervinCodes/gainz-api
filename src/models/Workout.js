const mongoose = require("mongoose");

// Define a schema for individual sets within an exercise
const SetSchema = new mongoose.Schema({
    setNumber: {
        type: Number,
        required: true 
    },
    reps: {
        type: Number,
        required: false,
        default: 0
    },
    weight: {
        type: Number,
        required: false,
        default: 0
    },
    isChecked: {
        type: Boolean,
        required: false,
        default: false
    }
})

// Define a schema for individual exercises
const ExerciseSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    sets: {
        type: [SetSchema], // Array of sets
        required: true 
    },
    personalRecord: { 
        type: Number, 
        default: 0 
    },
});

// Define a schema for a workout that includes multiple exercises
const WorkoutSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    type: {
        type: String,
        enum: ['strength', 'hypertrophy'],
        default: 'strength'
    },
    exercises: [ExerciseSchema], // Array of exercises
    createAt: { 
        type: Date, 
        default: Date.now 
    },
    completed: { 
        type: Boolean, 
        default: false 
    }
});

module.exports = mongoose.model("Workout", WorkoutSchema);
module.exports.SetSchema = SetSchema;