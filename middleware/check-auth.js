const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')

module.exports = (req, res, next) => {
    if(req.method === 'OPTIONS'){
        return next()
    }
    try{
        const token = req.headers.authorization.split(' ')[1] // Aurhorization : 'Bearer Token'
        if(!token) {
            throw new Error('No Token')
        }
        const decodedToken = jwt.verify(token,process.env.JWT_KEY)
        req.userData = { userId :decodedToken.id }
        next()
    }catch (err) {
        const error = new HttpError('No Authorization',401)
        return next(error)
    }
}