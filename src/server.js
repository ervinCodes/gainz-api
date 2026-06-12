require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const pool = require('./config/db');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises')
// const workoutRoutes = require('./routes/workouts')

const app = express()

app.use(cookieParser())

// CORS
const allowedOrigins = [
    'http://localhost:3000', // Next.js dev
    'https://www.gainzfitapp.com'
]

app.use(cors({
    origin: function (origin, callback) {
        if(allowedOrigins.includes(origin) || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(morgan('dev'));

// Routes 
app.use('/auth', authRoutes);
app.use('/exercises', exerciseRoutes);
// app.use('workouts', workoutRoutes);

// Health check 
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Gainz API is running' });
});

const PORT = process.env.PORT || 5051
app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
})
