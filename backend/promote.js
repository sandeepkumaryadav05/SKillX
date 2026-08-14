import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserProfile from './src/models/UserProfile.js';
dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error("❌ Please provide an email. Example: node promote.js test@example.com");
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillx';

mongoose.connect(mongoUri)
  .then(async () => {
    const targetEmail = email.toLowerCase().trim();
    const user = await UserProfile.findOneAndUpdate(
      { email: targetEmail },
      { role: 'admin' },
      { returnDocument: 'after' }
    );
    if (!user) {
      console.log(`⚠️ User profile for "${targetEmail}" not found in database.`);
      console.log(`Creating a new profile for "${targetEmail}" with role: "admin"...`);
      const newUser = await UserProfile.create({
        email: targetEmail,
        name: targetEmail.split('@')[0],
        role: 'admin',
        status: 'active'
      });
      console.log('✅ Created Admin User Profile:', newUser);
    } else {
      console.log(`✅ Successfully promoted "${targetEmail}" to admin!`);
      console.log(user);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
