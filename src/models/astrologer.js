const mongoose = require("mongoose");

const astrologerProfileSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
        unique:true
    },
    name:String,
    email:String,
    phone:String,
    experience:String,
    expertise:[String],
    languages:[String],
    about:String,
    price:{
        original:Number,
        discounted:Number
    },
    isOnline:{
        type:Boolean,
        default:false
    },
    availability:{
        online:{
            type:Boolean,
            default:false
        },
        startTime:{
            type:String,
            default:'09:00'
        },
        endTime:{
            type:String,
            default:'18:00'
        }
    },
    status:{
        chat:{
            type:Boolean,
            default:false
        },
        video:{
            type:Boolean,
            default:false
        }
    },
    profilePicture:String,
    rating:{
        type:Number,
        default:0
    },
    totalRatings:{
        type:Number,
        default:0
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }
}, {timestamps:true});

module.exports = mongoose.model('AstrologerProfile', astrologerProfileSchema); 
