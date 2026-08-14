// seed.js
import mongoose from 'mongoose';
import SkillExchange from './src/models/SkillExchange.js'; // Adjust path if necessary
import dotenv from 'dotenv';
dotenv.config();

const skillExchanges = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    userId: 'seed_john_doe',
    skillOffered: 'JavaScript Development',
    skillWanted: 'UI/UX Design',
    location: 'Remote',
    matchScore: 85
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    userId: 'seed_jane_smith',
    skillOffered: 'Graphic Design',
    skillWanted: 'Branding & Identity',
    location: 'San Francisco, CA',
    matchScore: 90
  },
  {
    name: 'Alice Brown',
    email: 'alice@example.com',
    userId: 'seed_alice_brown',
    skillOffered: 'Python Development',
    skillWanted: 'Machine Learning',
    location: 'Remote',
    matchScore: 88
  },
  {
    name: 'Bob White',
    email: 'bob@example.com',
    userId: 'seed_bob_white',
    skillOffered: 'Video Editing',
    skillWanted: 'Content Strategy',
    location: 'New York, NY',
    matchScore: 80
  },
  {
    name: 'Charlie Green',
    email: 'charlie@example.com',
    userId: 'seed_charlie_green',
    skillOffered: 'Content Writing',
    skillWanted: 'SEO',
    location: 'Remote',
    matchScore: 70
  },
  {
    name: 'Emily Black',
    email: 'emily@example.com',
    userId: 'seed_emily_black',
    skillOffered: 'Social Media Management',
    skillWanted: 'Data Analytics',
    location: 'Los Angeles, CA',
    matchScore: 75
  },
  {
    name: 'David Lee',
    email: 'david@example.com',
    userId: 'seed_david_lee',
    skillOffered: 'Marketing Strategy',
    skillWanted: 'Business Analysis',
    location: 'Chicago, IL',
    matchScore: 82
  },
  {
    name: 'Sarah White',
    email: 'sarah@example.com',
    userId: 'seed_sarah_white',
    skillOffered: 'Project Management',
    skillWanted: 'Agile Coaching',
    location: 'Remote',
    matchScore: 95
  },
  {
    name: 'Mason Carter',
    email: 'mason@example.com',
    userId: 'seed_mason_carter',
    skillOffered: 'Full-Stack Development',
    skillWanted: 'Cloud Computing',
    location: 'Austin, TX',
    matchScore: 90
  },
  {
    name: 'Sophia Martinez',
    email: 'sophia@example.com',
    userId: 'seed_sophia_martinez',
    skillOffered: 'Data Visualization',
    skillWanted: 'Data Engineering',
    location: 'Remote',
    matchScore: 80
  }
];

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillx';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Connect to DB
    await connectDB();

    // Remove all existing documents in the collection
    await SkillExchange.deleteMany();

    // Insert sample data
    await SkillExchange.insertMany(skillExchanges);
    console.log('Data successfully seeded!');
    process.exit();
  } catch (error) {
    console.error('Error seeding the database:', error);
    process.exit(1);
  }
};

seedDatabase();