const pool = require('../config/db');

module.exports = {
    createWorkout: async (req, res) => {
        try {
            const userId = req.user.id
            const { title, exercises } = req.body
            
            if (!title || !Array.isArray(exercises)) {
                return res.status(400).json({ message: 'Title and exercises are required' });
            }

            // Create the workout
            const newWorkout = await pool.query(
                'INSERT INTO workouts (user_id, title) VALUES ($1, $2) RETURNING *',
                [userId, title]
            );

            const workout = newWorkout.rows[0];

            // Loop through exercises and insert each one into the workout_exercises table
            for (const exercise of exercises) {
                const { name, sets } = exercise;

                // Insert exercise
                const newExercise = await pool.query(
                    'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
                    [workout.id, name]
                )

                const exerciseId = newExercise.rows[0].id

                // Inser sets for the exercise
                for(const set of sets) {
                    await pool.query(
                        `INSERT INTO sets (exercise_id, set_number, reps, weight, is_checked) VALUES ($1, $2, $3, $4, $5)`,
                        [exerciseId, set.setNumber, set.reps, set.weight, set.isChecked]
                    )
                }

                // Check if a personal record exists for this exercise
                const existingRecord = await pool.query(
                    `SELECT * FROM personal_records WHERE user_id = $1 AND exercise_name = $2`,
                    [userId, name]
                )

                // If no personal record exists, create one with a top_set of 0
                if(existingRecord.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO personal_records (user_id, exercise_name, top_set) VALUES ($1, $2, $3)`,
                        [userId, name, 0]
                    )
                }
            }
            res.status(201).json({ message: 'Workout created successfully' })
        } catch (error) {
        console.error('Error creating workout:', error);
        res.status(500).json({ message: 'Internal server error: createWorkout' });
        }
    },
    getWorkouts: async (req, res) => {
        try {
            const userId = req.user.id;
            const workouts = await pool.query(
                `SELECT * FROM workouts WHERE user_id = $1`,
                [userId]
            );
            res.status(200).json({ workouts: workouts.rows });
        } catch (error) {
            console.error('Error fetching workouts:', error);
            res.status(500).json({ message: 'Internal server error: getWorkouts' });
        }
    },
    getWorkoutById: async (req, res) => {
        try {
            const workoutId = req.params.id;
            const userId = req.user.id;

            // Fetch the workout by ID and ensure it belongs to the authenticated user
            const workoutResult = await pool.query(
                `SELECT * FROM workouts WHERE user_id = $1 AND id = $2`,
                [userId, workoutId]
            )

            // If no workout is found, return a 404 error
            if(workoutResult.rows.length === 0) {
                return res.status(404).json({ message: 'Workout not found' });
            }

            res.status(200).json({ workout: workoutResult.rows[0]})
        } catch (error) {
            console.error('Error fetching single workout:', error);
            res.status(500).json({ message: 'Internal server error: getSingleWorkout' });
        }
    },
    deleteWorkout: async (req, res) => {
        try {
            const workoutId = req.params.id;
            const userId = req.user.id

            // Check if the workout exists and belongs to the authenticated user
            const workoutResult = await pool.query(
                `SELECT * FROM workouts WHERE user_id = $1 AND id = $2`,
                [userId, workoutId]
            )

            // If no workout is found, return a 404 error
            if(workoutResult.rows.length === 0) {
                return res.status(404).json({ message: 'Workout not found' });
            }

            // Delete the workout
            await pool.query(
                `DELETE FROM workouts WHERE user_id = $1 AND id = $2`,
                [userId, workoutId]
            )

            res.status(200).json({ message: 'Workout deleted successfully' });

        } catch (error) {
            console.error('Error deleting workout:', error);
            res.status(500).json({ message: 'Internal server error: deleteWorkout' });
        }
    }
}