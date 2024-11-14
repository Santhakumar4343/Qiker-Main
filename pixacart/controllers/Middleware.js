const config	= require('../config/config');
//const API	    = require('./Api');
const jwt 		   = require('jsonwebtoken');
const Middleware = {}

Middleware.sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies[config.sessID]) {
        res.redirect('/dashboard');
    } else {
        next();
    }
}


// Define authentication middleware BEFORE your routes   && req.cookies[config.sessID]
Middleware.authenticate = function (req, res, next) {
    if (req.session.user ) {
        next();
    } else {
        res.redirect('/login');
    }
    //next();
}



Middleware.checkJWT = (req, res, next) => {
    if(!req.headers || !req.headers.authorization){
        res.status(403).send({
            status : 0,
            message: 'Authorization token must be provided.'
        });
        return;
    }
    let bearerHeader = req.headers.authorization;
    try {
        //const token = bearerHeader.split(' ')[1];
        const token = bearerHeader;
	    let decoded = jwt.verify(token, config.keys.secret);
        req.verifyUser = decoded;
        next();
    } catch(err) {
      res.status(200).json({status : 0, message : err.message});
    }
}



module.exports = Middleware;