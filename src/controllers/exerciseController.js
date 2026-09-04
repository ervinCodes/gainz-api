const ExerciseList = require('../models/ExerciseList')

const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
    }
}

// Helper to capitalize each word
function capitalizeName(name) {
    return name
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

const BASE_URL = `https://${process.env.RAPIDAPI_HOST}/api/v1`

module.exports = {
    getExercises: async (req, res) => {
        try {
            const response = await fetch(`${BASE_URL}/exercises`, options)
            const data = await response.json()
            res.status(200).json(data)
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    getBodyParts: async (req, res) => {
        try {
            const response = await fetch(`${BASE_URL}/bodyparts`, options)
            const data = await response.json()
            res.status(200).json(data)
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    searchExercises: async (req, res) => {
        try {
            const { name } = req.query
            if (!name) {
                return res.status(400).json({ message: 'Search query is required' })
            }

            // Search ExerciseDB API
            let apiResults = []
            try {
                const response = await fetch(`${BASE_URL}/exercises/search?search=${encodeURIComponent(name)}`, options)
                const data = await response.json()
                apiResults = data.data || []
            } catch (err) {
                console.error('ExerciseDB API error:', err)
            }

            // Search MongoDB custom exercises
            const customResults = await ExerciseList.find({
                name: { $regex: name, $options: 'i' }
            })

            // Format custom results to match ExerciseDB format
            const formattedCustom = customResults.map(exercise => ({
                exerciseId: exercise._id,
                name: exercise.name,
                bodyParts: [exercise.category],
                equipments: [],
                isCustom: true
            }))

            // Merge both results
            const combined = [...apiResults, ...formattedCustom]

            res.status(200).json({ data: combined })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    addCustomExercise: async (req, res) => {
        try {
            const { category } = req.body
            const name = capitalizeName(req.body.name)  // ← capitalize here

            if (!name) {
                return res.status(400).json({ message: 'Exercise name is required' })
            }

            // Check for duplicates
            const existing = await ExerciseList.findOne({
                name: { $regex: `^${name}$`, $options: 'i' }
            })

            if (existing) {
                return res.status(409).json({ message: 'This exercise already exists' })
            }

            const newExercise = await ExerciseList.create({
                name,
                category: category || 'Custom'
            })

            res.status(201).json({ message: 'Exercise added successfully', exercise: newExercise })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    getCustomExercises: async (req, res) => {
        try {
            const exercises = await ExerciseList.find({ isCustom: true })
            res.status(200).json({ exercises })
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    }
}