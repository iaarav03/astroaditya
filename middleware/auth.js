const jwt = require("jsonwebtoken");

const auth = async(req,res,next)=>{
    try{
        const token = req.header('Authorization').replace('Bearer ','');
        if(!token){
            throw new Error('No token provided');
        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findOne({
            _id:decoded.id,
            isVerified:true
        })
        if(!user){
            throw new Error("User not found");
        }
        req.user = user;
        req.token=token;
        next();
    }catch(error){
        res.status(401).json({
            success:false,
            message:"Unauthorized"
        })
    }
}

module.exports = auth;
