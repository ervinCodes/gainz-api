const Workout = require('../models/Workout')
const PersonalRecord = require('../models/PersonalRecord')
const ExerciseList = require('../models/ExerciseList')

module.exports = {
createWorkout: async (req, res) => {
    try {
        const userId = req.user.id
        const { title, exercises } = req.body  // ← removed type

        if (!title || !Array.isArray(exercises)) {
            return res.status(400).json({ message: 'Invalid data provided' })
        }

        const workout = await Workout.create({ userId, title, exercises })

        for (const exercise of exercises) {
            const existingRecord = await PersonalRecord.findOne({
                userId,
                exerciseName: exercise.name
            })

            if (!existingRecord) {
                await PersonalRecord.create({
                    userId,
                    exerciseName: exercise.name,
                    topSet: 0
                })
            }
        }

        res.status(201).json({ message: 'Workout created successfully', workout })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
},

    getWorkouts: async (req, res) => {
        try {
            const userId = req.user.id

            const workouts = await Workout.find({ userId }).sort({ createdAt: -1 })

            // Convert to plain objects so we can add properties
            const workoutsWithPR = await Promise.all(workouts.map(async (workout) => {
                const workoutObj = workout.toObject()  // convert to plain object

                workoutObj.exercises = await Promise.all(workoutObj.exercises.map(async (exercise) => {
                    const pr = await PersonalRecord.findOne({
                        userId,
                        exerciseName: exercise.name
                    })
                    return {
                        ...exercise,
                        topSet: pr?.topSet || 0  
                    }
                }))

                return workoutObj
            }))

            res.status(200).json({ workouts: workoutsWithPR })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    getSingleWorkout: async (req, res) => {
        try {
            const workoutId = req.params.id
            const userId = req.user.id

            const workout = await Workout.findOne({ _id: workoutId, userId })

            if (!workout) {
                return res.status(404).json({ message: 'Workout not found' })
            }

            // Convert to plain object so we can add properties
            const workoutObj = workout.toObject()

            workoutObj.exercises = await Promise.all(workoutObj.exercises.map(async (exercise) => {
                const pr = await PersonalRecord.findOne({
                    userId,
                    exerciseName: exercise.name
                })
                return {
                    ...exercise,
                    topSet: pr?.topSet || 0,
                    lastWorkout: pr?.lastWorkout?.[exercise.type] || null
                }
            }))

            res.status(200).json({ workout: workoutObj })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    deleteWorkout: async (req, res) => {
        try {
            const workoutId = req.params.id
            const userId = req.user.id

            const workout = await Workout.findOneAndDelete({ _id: workoutId, userId })

            if (!workout) {
                return res.status(404).json({ message: 'Workout not found' })
            }

            res.status(200).json({ message: 'Workout deleted successfully' })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    updateWorkout: async (req, res) => {
        try {
            const userId = req.user.id
            const workoutId = req.params.id
            const { exercises } = req.body

            const workout = await Workout.findOneAndUpdate(
                { _id: workoutId, userId },
                { exercises,
                    $inc: { completedCount: 1 }
                 },
                { new: true }
            )

            if (!workout) {
                return res.status(404).json({ message: 'Workout not found' })
            }

            for (const exercise of exercises) {
                const exerciseType = exercise.type

                const weights = exercise.sets
                    .map(set => set.weight)
                    .filter(w => w > 0)

                if (weights.length === 0) continue

                const maxWeight = Math.max(...weights)

                const pr = await PersonalRecord.findOne({ userId, exerciseName: exercise.name })

                if (pr) {
                    // Older records have no history yet, so seed it from the current PR first
                    if (pr.history.length === 0 && pr.topSet > 0) {
                        pr.history.push({ date: pr.dateAchieved || new Date(), maxWeight: pr.topSet })
                    }

                    if (maxWeight > pr.topSet) {
                        pr.topSet = maxWeight
                        pr.dateAchieved = new Date()
                    }

                    // Record this session
                    pr.history.push({ date: new Date(), maxWeight })

                    pr.lastWorkout[exerciseType] = {
                        sets: exercise.sets.map(set => ({ reps: set.reps, weight: set.weight })),
                        date: new Date()
                    }

                    pr.markModified('lastWorkout')
                    await pr.save()

                } else {
                    await PersonalRecord.create({
                        userId,
                        exerciseName: exercise.name,
                        topSet: maxWeight,
                        dateAchieved: new Date(),
                        history: [{ date: new Date(), maxWeight }],
                        lastWorkout: {
                            [exerciseType]: {
                                sets: exercise.sets.map(set => ({ reps: set.reps, weight: set.weight })),
                                date: new Date()
                            }
                        }
                    })
                }
            }

            res.status(200).json({ message: 'Workout updated successfully' })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },
    getExerciseProgress: async (req, res) => {
        try {
            const userId = req.user.id

            const personalRecords = await PersonalRecord.find({ userId })

            // One query for all categories instead of one per exercise
            const exerciseList = await ExerciseList.find({}, 'name category')
            const categoryByName = {}
            for (const item of exerciseList) {
                categoryByName[item.name.toLowerCase().trim()] = item.category
            }

            const progressData = {}

            for (const pr of personalRecords) {
                let history = pr.history.map(h => ({ date: h.date, maxWeight: h.maxWeight }))

                // Older records with no history show their PR as a single point
                if (history.length === 0 && pr.topSet > 0) {
                    history = [{ date: pr.dateAchieved, maxWeight: pr.topSet }]
                }

                // Skip exercises that were never actually logged
                if (history.length === 0) continue

                const category = categoryByName[pr.exerciseName.toLowerCase().trim()] || 'Other'

                if (!progressData[category]) {
                    progressData[category] = []
                }

                progressData[category].push({
                    exerciseName: pr.exerciseName,
                    topSet: pr.topSet,
                    dateAchieved: pr.dateAchieved,
                    history
                })
            }

            for (const category of Object.keys(progressData)) {
                progressData[category].sort((a, b) =>
                    a.exerciseName.localeCompare(b.exerciseName)
                )
            }

            res.status(200).json({ progress: progressData })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    }
}