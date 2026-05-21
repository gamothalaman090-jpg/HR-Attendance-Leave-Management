/**
 * Name: User.js
 * Purpose: Defines the structure and behavior of user documents in the database.
 * Dependencies: mongoose, bcryptjs
 * Author: Ian
 * Location: server/models/User.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-21
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, 'Please add a full name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'],
        default: 'user'
    },
    
    employmentStatus: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'terminated'],
        default: 'active',
        lowercase: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    profilePicture: {
        type: String,
        default: '' 
    },
    leaveBalances: {
        annual: { 
            allotted: { type: Number, default: 20 }, 
            left: { type: Number, default: 20 }
        },
        sick: { 
            allotted: { type: Number, default: 12 }, 
            left: { type: Number, default: 12 }
        },
        personal: { 
            allotted: { type: Number, default: 7 }, 
            left: { type: Number, default: 7 }
        }
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);