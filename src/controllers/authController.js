const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')

module.exports = {
    postSignup: async (req, res) => {
        try {
            const { userName, email, password } = req.body

            // Basic validation
            if (!userName || !email || !password) {
                return res.status(400).json({ message: 'Please fill in all fields' })
            }

            if (password.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters' })
            }

            // Check if user already exists
            const existingUser = await pool.query(
                'SELECT * FROM users WHERE email = $1 OR username = $2',
                [email, userName]
            )

            if (existingUser.rows.length > 0) {
                return res.status(409).json({ message: 'Account with that email or username already exists' })
            }

            // Hash password
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            // Insert new user
            const newUser = await pool.query(
                'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
                [userName, email, hashedPassword]
            )

            const user = newUser.rows[0]

            // Create JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            )

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
            })

            res.status(200).json({ user: { userName: user.username, email: user.email } })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    postLogin: async (req, res) => {
        try {
            const { email, password } = req.body

            // Basic validation
            if (!email || !password) {
                return res.status(400).json({ message: 'Please fill in all fields' })
            }

            // Find user
            const result = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            )

            if (result.rows.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials' })
            }

            const user = result.rows[0]

            // Compare password
            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' })
            }

            // Create JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            )

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
            })

            res.status(200).json({ user: { userName: user.username, email: user.email } })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    logout: (req, res) => {
        // With JWT, logout is handled on the frontend by deleting the token
        res.status(200).json({ message: 'Logged out successfully' })
    },

    getProfile: (req, res) => {
        try {
            const result = await.pool.query(
                'SELECT id, username, email, created_at FROM users WHERE id = $1',
                [req.user.id]
            )

            if(result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' })
            }

            const user = result.rows[0]
            res.status(200).json({ userName: user.username, email: user.email })
        } catch(err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    }
}