const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    fullName:{
        type:String,
        required:true,
    },

    phone:{
        type:String,
    },

    education:{
        type:String,
    },

    experience:{
        type:String,
    },

    skills:[
        String,
    ],

    location:{
        type:String,
    },

    linkedin:{
        type:String,
    },

    github:{
        type:String,
    },

    profilePhoto:{
        type:String,
        default:"",
    }

},{
    timestamps:true,
});

module.exports = mongoose.model("Profile",profileSchema);