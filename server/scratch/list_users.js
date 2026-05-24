module.paths.push('d:\\Projects\\WEBPROG PROJECT\\HR-Attendance-Leave-Management\\server\\node_modules');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: 'd:\\Projects\\WEBPROG PROJECT\\HR-Attendance-Leave-Management\\server\\.env' });
const connectDB = require('d:\\Projects\\WEBPROG PROJECT\\HR-Attendance-Leave-Management\\server\\config\\db');
const User = require('d:\\Projects\\WEBPROG PROJECT\\HR-Attendance-Leave-Management\\server\\models\\User');

async function run() {
  await connectDB();
  const users = await User.find({}).select('email role fullname company');
  console.log(JSON.stringify(users, null, 2));
  await mongoose.connection.close();
}
run();
