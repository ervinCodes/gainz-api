const Workout = require('../models/Workout')
const PersonalRecord = require('../models/PersonalRecord')

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

                // ← ADD THIS
                console.log('PR found:', pr)
                console.log('Max weight:', maxWeight)

                if (pr) {
                    if (maxWeight > pr.topSet) {
                        pr.topSet = maxWeight
                        pr.dateAchieved = new Date()
                    }

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
    }
}