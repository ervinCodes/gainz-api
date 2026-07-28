const pool = require('../config/db')

module.exports = {
    createWorkout: async (req, res) => {
        try {
            const userId = req.user.id
            const { title, exercises } = req.body

            if (!title || !Array.isArray(exercises)) {
                return res.status(400).json({ message: 'Invalid data provided' })
            }

            // Create the workout
            const newWorkout = await pool.query(
                'INSERT INTO workouts (user_id, title) VALUES ($1, $2) RETURNING *',
                [userId, title]
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
            const userId = req.user.id
            const workoutId = req.params.id

            const result = await pool.query(
                `SELECT w.*, 
                    json_agg(
                        json_build_object(
                            'id', e.id,
                            'name', e.name,
                            'personal_record', e.personal_record,
                            'sets', (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', s.id,
                                        'set_number', s.set_number,
                                        'reps', s.reps,
                                        'weight', s.weight,
                                        'is_checked', s.is_checked
                                    )
                                )
                                FROM sets s WHERE s.exercise_id = e.id
                            )
                        )
                    ) as exercises
                FROM workouts w
                LEFT JOIN exercises e ON e.workout_id = w.id
                WHERE w.id = $1 AND w.user_id = $2
                GROUP BY w.id`,
                [workoutId, userId]
            )

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Workout not found' })
            }

            res.status(200).json({ workout: result.rows[0] })

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
    }
}