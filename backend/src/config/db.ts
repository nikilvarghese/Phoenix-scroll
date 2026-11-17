import mongoose from 'mongoose';
import { cleanDuplicateProgress } from '../utils/cleanDuplicates.js';
import { migrateChaptersToStories } from '../utils/migrateChapters.js';

let isMigrationInitialized = false;

export const connectDB = async () => {
  // If already connected, return immediately without redundant reconnects or migrations
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/storybook';

    // Force connection to the 'storybook' database explicitly so collections do NOT end up in 'test'
    await mongoose.connect(mongoUri, {
      dbName: 'storybook',
    });

    console.log(`✅ Connected to MongoDB successfully (Database: 'storybook').`);

    // Run cleanups & migrations ONLY ONCE on server startup in background
    if (!isMigrationInitialized) {
      isMigrationInitialized = true;
      cleanDuplicateProgress().catch((err) => console.error('Clean duplicates error:', err));
      migrateChaptersToStories().catch((err) => console.error('Migrate chapters error:', err));
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
};

