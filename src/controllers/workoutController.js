const pool = require('../config/db')

module.exports = {
    createWorkout: async (req, res) => {
        try {
            const userId = req.user.id
            const { title, exercises, type } = req.body

            if (!title || !type || !Array.isArray(exercises)) {
                return res.status(400).json({ message: 'Invalid data provided' })
            }

            // Create the workout
            const newWorkout = await pool.query(
                'INSERT INTO workouts (user_id, title, type) VALUES ($1, $2, $3) RETURNING *',
                [userId, title, type]
            )

            const workout = newWorkout.rows[0]

            // Loop through exercises and insert each one
            for (const exercise of exercises) {
                const { name, sets } = exercise

                // Insert exercise
                const newExercise = await pool.query(
                    'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
                    [workout.id, name]
                )

                const exerciseId = newExercise.rows[0].id

                // Insert sets for each exercise
                if (sets && sets.length > 0) {
                    for (const set of sets) {
                        await pool.query(
                            'INSERT INTO sets (exercise_id, set_number, reps, weight, is_checked) VALUES ($1, $2, $3, $4, $5)',
                            [exerciseId, set.setNumber, set.reps, set.weight, set.isChecked]
                        )
                    }
                }

                // Check if personal record exists for this exercise
                const existingRecord = await pool.query(
                    'SELECT * FROM personal_records WHERE user_id = $1 AND exercise_name = $2',
                    [userId, name]
                )

                // If no personal record exists, create one
                if (existingRecord.rows.length === 0) {
                    await pool.query(
                        'INSERT INTO personal_records (user_id, exercise_name, top_set) VALUES ($1, $2, $3)',
                        [userId, name, 0]
                    )
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

            // 1. Get all workouts
            const workoutResult = await pool.query(
                'SELECT * FROM workouts WHERE user_id = $1 ORDER BY created_at DESC',
                [userId]
            )

            const workouts = workoutResult.rows

            // 2. For each workout, get its exercieses
            for (const workout of workouts) {
                const exerciseResult = await pool.query(
                    `SELECT * FROM exercises WHERE workout_id = $1`,
                    [workout.id]
                )
                workout.exercises = exerciseResult.rows

                // 3. For each exercise, get its PR
                for (const exercise of workout.exercises) {
                    const prResult = await pool.query(
                        `SELECT * FROM personal_records WHERE user_id = $1 AND exercise_name = $2`,
                        [userId, exercise.name]
                    )
                    exercise.top_set = prResult.rows[0]?.top_set || 0
            }
            }

            

            res.status(200).json({ workouts })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },
    getSingleWorkout: async (req, res) => {
        try {
            const workoutId = req.params.id
            const userId = req.user.id

            // 1. Get the workout
            const workoutResult = await pool.query(
                `SELECT * FROM workouts WHERE id = $1 AND user_id = $2`,
                [workoutId, userId]
            )

            if (workoutResult.rows.length === 0) {
                return res.status(404).json({ message: 'Workout not found' })
            }

            const workout = workoutResult.rows[0]

            // 2. Get exercises for this workout
            const exerciseResult = await pool.query(
                `SELECT * FROM exercises WHERE workout_id = $1`,
                [workoutId]
            )

            workout.exercises = exerciseResult.rows

            // 3. For each exercise get its sets AND personal record
            for (const exercise of workout.exercises) {
                // Get sets
                const setsResult = await pool.query(
                    `SELECT * FROM sets WHERE exercise_id = $1 ORDER BY set_number ASC`,
                    [exercise.id]
                )
                exercise.sets = setsResult.rows

                // Get personal record
                const prResult = await pool.query(
                    `SELECT top_set, last_workout FROM personal_records WHERE user_id = $1 AND exercise_name = $2`,
                    [userId, exercise.name]
                )
                const pr = prResult.rows[0]
                exercise.top_set = pr?.top_set || 0
                exercise.last_workout = pr?.last_workout?.[workout.type] || null
            }

            res.status(200).json({ workout })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    deleteWorkout: async (req, res) => {
        try {
            const workoutId = req.params.id

            await pool.query(
                'DELETE FROM workouts WHERE id = $1',
                [workoutId]
            )

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
            const { exercises, type } = req.body 

            for(let exercise of exercises) {
                // 1. Loop through each set and update one at a time
                for (const set of exercise.sets) {
                    await pool.query(
                        `UPDATE sets 
                        SET reps = $1, weight = $2, is_checked = $3 
                        WHERE id = $4`,
                        [set.reps, set.weight, set.isChecked, set.id]
                    )
                }

                // 2. Calculate max weight
                const weights = exercise.sets.map(set => set.weight)
                const maxWeight = Math.max(...weights)

                // 3. Check if a personal record exists for this exercise
                const prResult = await pool.query(
                    `SELECT * FROM personal_records WHERE user_id = $1 AND exercise_name = $2`,
                    [userId, exercise.name]
                )
                if (prResult.rows.length > 0) {
                    // Update personal record if max weight is greater than current top_set
                    if (maxWeight > prResult.rows[0].top_set) {
                        await pool.query(
                            `UPDATE personal_records SET top_set = $1 WHERE user_id = $2 AND exercise_name = $3`,
                            [maxWeight, userId, exercise.name]
                        )
                    }
                } else {
                    // Create a new personal record if none exists
                    await pool.query(
                        `INSERT INTO personal_records (user_id, exercise_name, top_set) VALUES ($1, $2, $3)`,
                        [userId, exercise.name, maxWeight]
                    )
                }

                // 4. Always update last_workout after PR check
                const lastWorkoutData = {
                    [type]: {
                        sets: exercise.sets.map(set => ({ reps: set.reps, weight: set.weight })),
                        date: new Date().toISOString()
                    }
                }

                await pool.query(
                    `UPDATE personal_records 
                    SET last_workout = jsonb_set(
                        COALESCE(last_workout, '{}'),
                        $3,
                        $4
                    )
                    WHERE user_id = $1 AND exercise_name = $2`,
                    [
                        userId,
                        exercise.name,
                        `{${type}}`,
                        JSON.stringify(lastWorkoutData[type])
                    ]
                )
            }
            res.status(200).json({ message: 'Workout updated successfully '})

        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Server error' })
        }
    }
}

// 1. Get userId from JWT and workoutId from req.params.id
// 2. Get exercises from req.body
// 3. For each exercise:
//    a. Update the sets in the database
//    b. Find the max weight lifted in the sets
//    c. Check if a personal record exists for this exercise
//    d. If max weight > current top_set → update personal record
//    e. If no personal record exists → create one
// 4. Return 200 success