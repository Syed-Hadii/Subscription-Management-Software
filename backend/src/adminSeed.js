const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/adminModel');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB');
        const admin = new User({
            email: 'admin@example.com',
            password: 'admin123', // Will be hashed by pre-save hook
        });
        await admin.save();
        console.log('Admin user created');
        mongoose.connection.close();
    })
    .catch((err) => {
        console.error('Error:', err);
        mongoose.connection.close();
    });