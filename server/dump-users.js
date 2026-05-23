const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://iksianghio_db_user:4wCYdrkhBsVVp3Hw@nini.a3iqwpk.mongodb.net/Nini_hr_management_app?retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Users found:', users.map(u => ({ fullname: u.fullname, email: u.email, role: u.role, employmentStatus: u.employmentStatus })));
    await mongoose.disconnect();
}

main().catch(console.error);
