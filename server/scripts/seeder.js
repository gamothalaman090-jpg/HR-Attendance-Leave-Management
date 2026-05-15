/**
 * Name: Seeder.js
 * Purpose: Populates the database with initial admin and user accounts.
 * Dependencies:
 * Author: Ian
 * Location: server/scripts/seeder.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-15
 */

/**
 * Name: seeder.js
 * Location: server/scripts/seeder.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const dns = require('dns');

// DNS Fix for SRV issues
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load .env
const envPath = path.join(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error(`Could not find .env file at ${envPath}`);
    process.exit(1);
}

const User = require('../models/User');

const seedData = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database Connected');
        const users = [
            {
                fullname: 'Super Admin User',
                email: 'superadmin@nini.com',
                password: 'password123',
                role: 'superadmin'
            },
            {
                fullname: 'Admin User',
                email: 'admin@nini.com',
                password: 'password123',
                role: 'admin'
            },
            {
                fullname: 'Regular User',
                email: 'user@nini.com',
                password: 'password123',
                role: 'user'
            }
        ];

        console.log('🌱 Seeding users (appending to existing data)...');
        for (let u of users) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u);
                console.log(`+ Created: ${u.fullname} [${u.role}]`);
            } else {
                console.log(`- Skipped: ${u.email} (Already exists)`);
            }
        }

        console.log('🚀 SEEDING COMPLETED SUCCESSFULLY!');
        process.exit();
    } catch (err) {
        console.error('❌ SEEDING FAILED:');
        console.error(err.message);
        process.exit(1);
    }
};

seedData();