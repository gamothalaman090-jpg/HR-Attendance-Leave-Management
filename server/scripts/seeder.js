/**
 * Name: seeder.js
 * Purpose: Populates the database with initial admin, user accounts, and dummy employee metrics data.
 * Dependencies: mongoose, dotenv, path, bcryptjs, dns
 * Author: Ian
 * Location: server/scripts/seeder.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-21
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
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
            throw new Error('MONGO_URI is not defined in .env file');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database Connected');

        const users = [
            // --- CORE MANAGEMENT ACCOUNTS ---
            {
                fullname: 'Super Admin User',
                email: 'superadmin@nini.com',
                password: 'password123',
                role: 'superadmin',
                employmentStatus: 'active'
            },
            {
                fullname: 'Admin User',
                email: 'admin@nini.com',
                password: 'password123',
                role: 'admin',
                employmentStatus: 'active'
            },
            {
                fullname: 'Regular User',
                email: 'user@nini.com',
                password: 'password123',
                role: 'user',
                employmentStatus: 'active',
                leaveBalances: {
                    annual: { allotted: 20, left: 15 },
                    sick: { allotted: 12, left: 10 },
                    personal: { allotted: 7, left: 5 }
                }
            },

            // --- NEW: DUMMY EMPLOYEE ACCOUNTS FOR DASHBOARD TESTING ---
            {
                fullname: 'Alice Henderson',
                email: 'alice@nini.com',
                password: 'password123',
                role: 'user',
                employmentStatus: 'active',
                leaveBalances: {
                    annual: { allotted: 20, left: 18 },
                    sick: { allotted: 12, left: 12 },
                    personal: { allotted: 7, left: 6 }
                }
            },
            {
                fullname: 'Bob Miller',
                email: 'bob@nini.com',
                password: 'password123',
                role: 'user',
                employmentStatus: 'active',
                leaveBalances: {
                    annual: { allotted: 20, left: 10 },
                    sick: { allotted: 12, left: 8 },
                    personal: { allotted: 7, left: 2 }
                }
            },
            {
                fullname: 'Charlie Green',
                email: 'charlie@nini.com',
                password: 'password123',
                role: 'user',
                employmentStatus: 'active',
                leaveBalances: {
                    annual: { allotted: 20, left: 20 },
                    sick: { allotted: 12, left: 9 },
                    personal: { allotted: 7, left: 4 }
                }
            },
            {
                fullname: 'Diana Prince',
                email: 'diana@nini.com',
                password: 'password123',
                role: 'user',
                employmentStatus: 'active',
                leaveBalances: {
                    annual: { allotted: 20, left: 5 },
                    sick: { allotted: 12, left: 4 },
                    personal: { allotted: 7, left: 1 }
                }
            },
            {
                fullname: 'Evan Wright',
                email: 'evan@nini.com',
                password: 'password123',
                role: 'user',
                employmentStatus: 'suspended', // Will test filtering rules!
                leaveBalances: {
                    annual: { allotted: 20, left: 14 },
                    sick: { allotted: 12, left: 11 },
                    personal: { allotted: 7, left: 7 }
                }
            },
            {
                fullname: 'Fiona Gallagher',
                email: 'fiona@nini.com',
                password: 'password123',
                role: 'user',
                employmentStatus: 'terminated', // Will test filtering rules!
                leaveBalances: {
                    annual: { allotted: 20, left: 0 },
                    sick: { allotted: 12, left: 0 },
                    personal: { allotted: 7, left: 0 }
                }
            }
        ];

        console.log('Seeding users (appending to existing data)...');
        for (let u of users) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                // Mongoose .create() triggers the .pre('save') hook to hash the passwords automatically
                await User.create(u);
                console.log(`+ Created: ${u.fullname} [${u.role}] - Status: ${u.employmentStatus}`);
            } else {
                console.log(`- Skipped: ${u.email} (Already exists)`);
            }
        }

        console.log('SEEDING COMPLETED SUCCESSFULLY!');
        process.exit();
    } catch (err) {
        console.error('SEEDING FAILED:');
        console.error(err.message);
        process.exit(1);
    }
};

seedData();