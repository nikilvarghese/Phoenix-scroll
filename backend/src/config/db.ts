import mongoose from 'mongoose';
import { cleanDuplicateProgress } from '../utils/cleanDuplicates.js';
import { migrateChaptersToStories } from '../utils/migrateChapters.js';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/storybook';

    // Force connection to the 'storybook' database explicitly so collections do NOT end up in 'test'
    await mongoose.connect(mongoUri, {
      dbName: 'storybook',
    });

    console.log(`✅ Connected to MongoDB successfully (Database: 'storybook').`);

    // Automatically clean up any pre-existing duplicate progress entries in MongoDB
    await cleanDuplicateProgress();

    // Automatically consolidate legacy standalone chapter documents into embedded story.chapters arrays
    await migrateChaptersToStories();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
};
