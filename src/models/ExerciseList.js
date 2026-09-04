const mongoose = require('mongoose')

const ExerciseListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        default: 'Custom'
    },
    isCustom: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('ExerciseList', ExerciseListSchema)