require('dotenv').config()
const mongoose = require('mongoose')
const ExerciseList = require('../models/ExerciseList')

const exercises = [
    // Chest
    { name: 'Barbell Bench Press', category: 'Chest' },
    { name: 'Incline Barbell Bench Press', category: 'Chest' },
    { name: 'Decline Barbell Bench Press', category: 'Chest' },
    { name: 'Dumbbell Bench Press', category: 'Chest' },
    { name: 'Incline Dumbbell Bench Press', category: 'Chest' },
    { name: 'Decline Dumbbell Bench Press', category: 'Chest' },
    { name: 'Dumbbell Flyes', category: 'Chest' },
    { name: 'Incline Dumbbell Flyes', category: 'Chest' },
    { name: 'Cable Crossover', category: 'Chest' },
    { name: 'Pec Deck Machine', category: 'Chest' },
    { name: 'Push Ups', category: 'Chest' },
    { name: 'Chest Dips', category: 'Chest' },

    // Back
    { name: 'Barbell Row', category: 'Back' },
    { name: 'Pendlay Row', category: 'Back' },
    { name: 'Dumbbell Row', category: 'Back' },
    { name: 'Pull Ups', category: 'Back' },
    { name: 'Chin Ups', category: 'Back' },
    { name: 'Lat Pulldown', category: 'Back' },
    { name: 'Seated Cable Row', category: 'Back' },
    { name: 'T-Bar Row', category: 'Back' },
    { name: 'Deadlift', category: 'Back' },
    { name: 'Rack Pull', category: 'Back' },
    { name: 'Straight Arm Pulldown', category: 'Back' },
    { name: 'Face Pulls', category: 'Back' },
    { name: 'Shrugs', category: 'Back' },

    // Shoulders
    { name: 'Barbell Overhead Press', category: 'Shoulders' },
    { name: 'Dumbbell Overhead Press', category: 'Shoulders' },
    { name: 'Military Press', category: 'Shoulders' },
    { name: 'Arnold Press', category: 'Shoulders' },
    { name: 'Lateral Raises', category: 'Shoulders' },
    { name: 'Front Raises', category: 'Shoulders' },
    { name: 'Rear Delt Flyes', category: 'Shoulders' },
    { name: 'Cable Lateral Raises', category: 'Shoulders' },
    { name: 'Upright Row', category: 'Shoulders' },
    { name: 'Machine Shoulder Press', category: 'Shoulders' },

    // Legs
    { name: 'Barbell Squat', category: 'Legs' },
    { name: 'Front Squat', category: 'Legs' },
    { name: 'Hack Squat', category: 'Legs' },
    { name: 'Leg Press', category: 'Legs' },
    { name: 'Romanian Deadlift', category: 'Legs' },
    { name: 'Stiff Leg Deadlift', category: 'Legs' },
    { name: 'Bulgarian Split Squat', category: 'Legs' },
    { name: 'Lunges', category: 'Legs' },
    { name: 'Walking Lunges', category: 'Legs' },
    { name: 'Leg Extension', category: 'Legs' },
    { name: 'Leg Curl', category: 'Legs' },
    { name: 'Seated Leg Curl', category: 'Legs' },
    { name: 'Standing Calf Raise', category: 'Legs' },
    { name: 'Seated Calf Raise', category: 'Legs' },
    { name: 'Hip Thrust', category: 'Legs' },
    { name: 'Glute Bridge', category: 'Legs' },
    { name: 'Sumo Deadlift', category: 'Legs' },
    { name: 'Step Ups', category: 'Legs' },
    { name: 'Box Jumps', category: 'Legs' },

    // Biceps
    { name: 'Barbell Curl', category: 'Biceps' },
    { name: 'Dumbbell Curl', category: 'Biceps' },
    { name: 'Hammer Curl', category: 'Biceps' },
    { name: 'Incline Dumbbell Curl', category: 'Biceps' },
    { name: 'Preacher Curl', category: 'Biceps' },
    { name: 'Cable Curl', category: 'Biceps' },
    { name: 'Concentration Curl', category: 'Biceps' },
    { name: 'EZ Bar Curl', category: 'Biceps' },
    { name: 'Reverse Curl', category: 'Biceps' },
    { name: 'Zottman Curl', category: 'Biceps' },

    // Triceps
    { name: 'Close Grip Bench Press', category: 'Triceps' },
    { name: 'Tricep Dips', category: 'Triceps' },
    { name: 'Skull Crushers', category: 'Triceps' },
    { name: 'Tricep Pushdown', category: 'Triceps' },
    { name: 'Overhead Tricep Extension', category: 'Triceps' },
    { name: 'Cable Overhead Tricep Extension', category: 'Triceps' },
    { name: 'Diamond Push Ups', category: 'Triceps' },
    { name: 'Kickbacks', category: 'Triceps' },

    // Core
    { name: 'Plank', category: 'Core' },
    { name: 'Crunches', category: 'Core' },
    { name: 'Sit Ups', category: 'Core' },
    { name: 'Leg Raises', category: 'Core' },
    { name: 'Russian Twists', category: 'Core' },
    { name: 'Cable Crunches', category: 'Core' },
    { name: 'Ab Rollout', category: 'Core' },
    { name: 'Hanging Leg Raises', category: 'Core' },
    { name: 'Dead Bug', category: 'Core' },
    { name: 'Bird Dog', category: 'Core' },
]

async function seedExercises() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('MongoDB connected')

        let added = 0
        let skipped = 0

        for (const exercise of exercises) {
            const existing = await ExerciseList.findOne({
                name: { $regex: `^${exercise.name}$`, $options: 'i' }
            })

            if (!existing) {
                await ExerciseList.create({
                    name: exercise.name,
                    category: exercise.category,
                    isCustom: false
                })
                added++
                console.log(`Added: ${exercise.name}`)
            } else {
                skipped++
                console.log(`Skipped (already exists): ${exercise.name}`)
            }
        }

        console.log(`\nDone! Added: ${added}, Skipped: ${skipped}`)
        process.exit(0)

    } catch (err) {
        console.error('Error seeding exercises:', err)
        process.exit(1)
    }
}

seedExercises()