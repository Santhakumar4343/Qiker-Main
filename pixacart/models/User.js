const mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    fullname :{ type: String,default:null},
    role: {type: Number,default:2},
    email :{ type: String},
    contact :{ type: Number,default:0},
    password :{ type: String,default:null},
    profile_image :{ type: String,default:null},
    status :{ type: Number, default:1},
    resetPasswordToken:{ type: String,default:null},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

var userSchema = mongoose.model('users',userSchema);
module.exports = userSchema
