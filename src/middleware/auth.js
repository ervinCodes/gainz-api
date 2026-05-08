const jwt = require('jsonwebtoken');

module.exports = {
    ensureAuth: (req, res, next) => {
        const token = req.cookies?.token // < read from cookie

        if(!token) {
            return res.status(401).json({ message: Unauthorized })
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