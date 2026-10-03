import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.log('⚡ No MONGODB_URI found in .env. Initializing embedded database server...');
      const dbPath = path.join(process.cwd(), 'data', 'db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbPath,
          storageEngine: 'wiredTiger',
        },
      });
      mongoUri = mongoMemoryServer.getUri();
      console.log(`✅ Embedded MongoDB server running at ${mongoUri}`);
    }

    // Force connection to the 'storybook' database explicitly so collections do NOT end up in 'test'
    await mongoose.connect(mongoUri, {
      dbName: 'storybook',
    });

    console.log(`✅ Connected to MongoDB successfully (Database: 'storybook').`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
