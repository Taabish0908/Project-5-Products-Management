const jwt = require('jsonwebtoken')
const { default: mongoose } = require('mongoose')
// const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')

const authenticate = async function(req, res, next){
    try{
        const token = req.header('Authorization',"Bearer Token");
        
        if(!token){
        return res.status(400).send({status: false, message : "Please provide token"})
        }
        let tokendata = token.split(" ");

        const decodedToken = jwt.verify(tokendata[1], "group2project3almostdone") 

        if(!decodedToken){
        return res.status(401).send({status : false, message: "authentication failed"})
        }
        // setting a key in request,  "decodedToken" which consist userId and exp.
        req.decodedToken = decodedToken
        
        next()

    }catch(err){
       
        res.status(500).send({error : err.message})
    }
}

const authorise = async function(req, res,next){
    // try{
        const userId = req.params.userId
        // const token = req.header('Authorization',"Bearer Token");
        // const decodedToken = req.decodedToken
        const token = req.header('Authorization',"Bearer Token");
        let tokendata = token.split(" ");
        const decodedToken = jwt.verify(tokendata[1], "group2project3almostdone")
       
        if(mongoose.Types.ObjectId.isValid(userId) == false){
        return res.status(400).send({status : false, message : "Sorry!!! the given userId is not valid"})
        }

        const user = await userModel.findById(userId)

        // if(!user){
        // return res.status(404).send({status : false, message : "user has already been deleted"})    
        // }

        if((decodedToken.userId != userId)){
        return res.status(403).send({status : false, message : "unauthorized access"})
        }
        
        
        next()

    // }catch(err){
    //     res.status(500).send({error : err.message})
    // }
}

module.exports.authenticate = authenticate
module.exports.authorise = authorise