const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    provider: { type: String, default: 'local' }
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    try {
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Password hashed');
    } catch (err) {
        console.error('Bcrypt error:', err);
        throw err;
    }
});

const User = mongoose.model('UserTest' + Date.now(), UserSchema);

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'test' + Date.now() + '@test.com';
        const user = new User({
            name: 'Test',
            email: email,
            password: 'password123'
        });

        console.log('Saving user...');
        await user.save();
        console.log('User saved');

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );
        console.log('Token signed:', token);

        fs.writeFileSync('test_success.txt', 'SUCCESS');
        process.exit(0);
    } catch (err) {
        console.error('TEST FAILED:', err);
        fs.writeFileSync('test_error.txt', err.stack || err.message);
        process.exit(1);
    }
}

test();
