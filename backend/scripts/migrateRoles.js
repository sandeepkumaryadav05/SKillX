import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import UserProfile from '../src/models/UserProfile.js';
import { getDefaultPermissions } from '../src/services/permissionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrateRoles = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillx';
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const users = await UserProfile.find({});
    console.log(`Found ${users.length} users to process.`);

    let updatedCount = 0;

    for (const user of users) {
      let needsUpdate = false;

      // Check and update legacy roles
      if (['Mentor', 'Learner', 'mentor', 'learner'].includes(user.role)) {
        user.role = 'user';
        needsUpdate = true;
      }

      // Check if permissions need to be set
      if (!user.permissions || user.permissions.length === 0) {
        user.permissions = getDefaultPermissions(user.role);
        needsUpdate = true;
      }

      if (needsUpdate) {
        await user.save();
        updatedCount++;
        console.log(`Updated user: ${user.email} -> Role: ${user.role}, Permissions set.`);
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateRoles();
