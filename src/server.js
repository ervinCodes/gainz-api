require('dotenv').config()

const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')

const authRoutes = require('./routes/auth')
const exerciseRoutes = require('./routes/exercises')
const workoutRoutes = require('./routes/workouts')

const app = express()

// Connect to MongoDB
connectDB()

app.use(cookieParser())

// CORS
const allowedOrigins = [
    'http://localhost:3000',
    'https://www.gainzfitapp.com'
]

app.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use('/auth', authRoutes)
app.use('/exercises', exerciseRoutes)
app.use('/workouts', workoutRoutes)

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Gainz API is running' })
})

const PORT = process.env.PORT || 5051
app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`)
})