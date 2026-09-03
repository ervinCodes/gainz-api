const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require ("../models/User")

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
            const existingUser = await User.findOne({ email })

            if (existingUser) {
                return res.status(409).json({ message: 'Account with that email or username already exists' })
            }

            // Insert new user
            const newUser = await User.create({ userName, email, password })

            const user = newUser

            // Create JWT token
            const token = jwt.sign(
                { id: user._id, userName: user.userName, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            )

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
            })

            res.status(200).json({ user: { userName: user.userName, email: user.email } })

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
            const result = await User.findOne({ email })
            
            // User not found
            if (!result) {
                return res.status(401).json({ message: 'Invalid credentials' })
            }

            const user = result;

            // Compare password
            const isMatch = await user.comparePassword(password)

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' })
            }

            // Create JWT token
            const token = jwt.sign(
                { id: user._id, userName: user.userName, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            )

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
            })

            res.status(200).json({ user: { userName: user.userName, email: user.email } })

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    logout: (req, res) => {
        // With JWT, logout is handled on the frontend by deleting the token
        res.clearCookie('token')
        res.status(200).json({ message: 'Logged out successfully' })
    },

    getProfile: async (req, res) => {
        try {
            // Find the user by their ID
            const result = await User.findById(req.user.id)
            
            // User not found
            if(!result) {
                return res.status(404).json({ message: 'User not found' })
            }

            const user = result
            res.status(200).json({ user: { userName: user.userName, email: user.email } })
        } catch(err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    }
}