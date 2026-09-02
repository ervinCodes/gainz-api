
const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/jason',
        'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
    }
}

const BASE_URL = `https://${process.env.RAPIDAPI_HOST}/api/v1`

module.exports = {
    getExercises: async (req, res) => {
        try {
            const response = await fetch(`${BASE_URL}/exercises`, options)
            const data = await response.json()
            res.status(200).json(data)
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },
    
    getBodyParts: async (req, res) => {
        try {
            const response = await fetch(`${BASE_URL}/bodyparts`, options)
            const data = await response.json()
            res.status(200).json(data)
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error' })
        }
    },

    searchExercises: async (req, res) => {
        try {
            const { name } = req.query
            if(!name) {
                return res.status(400).json({ message: 'Search query is required' })
            }
            const response = await fetch(`${BASE_URL}/exercises/search?search=${encodeURIComponent(name)}`, options)
            const data = await response.json()
            res.status(200).json(data)
        } catch (err) {
            res.status(500).json({ message: 'Server error' })
        }
    }
}