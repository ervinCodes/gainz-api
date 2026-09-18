const jwt = require('jsonwebtoken')

module.exports = {
    ensureAuth: (req, res, next) => {
        // Check cookie first, then Authorization header
        let token = req.cookies?.token

        if (!token) {
            const authHeader = req.headers.authorization
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1]
            }
        }

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = decoded
            next()
        } catch (err) {
            return res.status(401).json({ message: 'Invalid token' })
        }
    }
}