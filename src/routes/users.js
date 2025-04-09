const express = require("express");
const router = express.Router();
const {authenticateToken} = require("../middleware/auth");
const User = require("../models/user");

router.get("/profile", authenticateToken, async(req,res)=>{
    try{
        const user = await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({error:"User not found"});
        }
        res.json(user);
    }
    catch(error){
        console.log("Error in fetching user profile", error);
        res.status(500).json({error:"Internal server error"});
    }
})

router.put("/profile",authenticateToken,async(req,res)=>{
    try{
        const {name,phone,address}=req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set:{
                    name,
                    phone,
                    address,
                    updatedAt:new Date()
                }
            },
            {new:true}
        );
        if(!user){
            return res.status(404).json("User not found");
        }
        res.json("Profile updated successfully");
    }
    catch(error){
        console.log("Error in updating user profile", error);
        res.status(500).json({error:"Internal server error"});
    }
})

router.get("/balance",authenticateToken,async(req,res)=>{
    try{
        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({error:"User not found"});
        }
        return res.status(200).json({balance:user.balance});
    }
    catch(error){
        console.log("Error in fetching user balance", error);
        res.status(500).json({error:"Internal server error"});
    }
})

router.get('/',async (req, res) => {
    try {
        const shops = await Shop.find();
        res.json(shops);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post("/add-money",authenticateToken,async(req,res)=>{
    try{
        const {amount} = req.body;
        const user = await User.findById(req.user.id);

        if(!user){
            return res.status(404).json({error:"User not found"})
        }
        user.balance += amount;
        await user.save();
        return res.status(200).json({message:"Money added successfully",balance:user.balance});
    }
    catch(error){
        console.log("Error in adding money", error);
        res.status(500).json({error:"Internal server error"});
    }
})


module.exports = router;
