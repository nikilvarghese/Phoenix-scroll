import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import Story from '../models/Story.js';
import Chapter from '../models/Chapter.js';
import { calculateWordCount, formatPartHeaders } from './sanitize.js';

export const AUTHOR_EMAIL = 'nikiledwin6@gmail.com';
export const AUTHOR_NAME = 'Nikil Varghese';

// Convert plain text file with double newlines into clean HTML paragraphs & format Part/Arc headings
function formatTextToHtml(rawText: string): string {
  const paragraphs = rawText.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  const rawHtml = paragraphs
    .map((p) => {
      const cleanP = p.replace(/\r?\n/g, ' ');
      return `<p>${cleanP}</p>`;
    })
    .join('\n');
  return formatPartHeaders(rawHtml);
}

export const seedInitialData = async () => {
  try {
    // 1. Ensure Author Account
    const passwordHash = await bcrypt.hash('Nikiledwin1', 12);
    const cleanEmail = AUTHOR_EMAIL.toLowerCase();

    let author = await User.findOne({ email: cleanEmail });
    if (!author) {
      author = await User.create({
        name: AUTHOR_NAME,
        email: cleanEmail,
        passwordHash,
        role: 'owner',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      });
      console.log(`👤 Author account created for ${AUTHOR_NAME} (${AUTHOR_EMAIL})`);
    } else {
      author.name = AUTHOR_NAME;
      author.passwordHash = passwordHash;
      author.role = 'owner';
      await author.save();
    }

    // 2. Sync to 'login' collection for Compass compatibility
    if (User.db) {
      try {
        const loginColl = User.db.collection('login');
        await loginColl.updateOne(
          { email: cleanEmail },
          {
            $set: {
              name: AUTHOR_NAME,
              email: cleanEmail,
              passwordHash,
              role: 'owner',
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Syncing to login collection skipped:', err);
      }
    }

    // 3. Check if database ALREADY has stories stored in MongoDB
    const existingStoryCount = await Story.countDocuments();
    if (existingStoryCount > 0) {
      console.log(`ℹ️ MongoDB database already contains ${existingStoryCount} story/stories. Preserving live database content without overwriting.`);
      return;
    }

    console.log('🌱 No stories found in database. Seeding initial manuscript of "Echoes of a Cursed Heart"...');

    // 4. Create "Echoes of a Cursed Heart" Story
    const story = await Story.create({
      title: 'Echoes of a Cursed Heart',
      subtitle: 'PART I — The Lie Called Despair | ARC 1 — The Broken Boy',
      description: 'The sky above the sprawling metropolis did not blaze with fire. Instead, it seemed to bleed... A dark fantasy novel following Phoenix as fate places him directly in the path of ancient darkness.',
      authorName: AUTHOR_NAME,
      coverImage: 'http://localhost:5000/uploads/echoes_cursed_heart_cover.jpg',
      visibility: 'public',
      isPublished: true,
      publishedAt: new Date(),
      genre: 'Dark Fantasy',
      ownerId: author._id,
    });

    const chaptersDir = path.resolve(process.cwd(), 'src', 'data', 'chapters');
    const chapterFiles = [
      { file: 'prologue.txt', title: 'Blood Beneath the Dawn', isPrologue: true, order: 0 },
      { file: 'ch1.txt', title: 'An Ordinary Morning', isPrologue: false, order: 1 },
      { file: 'ch2.txt', title: 'Invisible', isPrologue: false, order: 2 },
      { file: 'ch3.txt', title: 'Behind Closed Doors', isPrologue: false, order: 3 },
      { file: 'ch4.txt', title: 'The Girl Across the Street', isPrologue: false, order: 4 },
      { file: 'ch5.txt', title: 'Cracks', isPrologue: false, order: 5 },
      { file: 'ch6.txt', title: 'Whispers', isPrologue: false, order: 6 },
      { file: 'ch7.txt', title: 'Almost', isPrologue: false, order: 7 },
      { file: 'ch8.txt', title: 'Goodbye', isPrologue: false, order: 8 },
    ];

    let totalWords = 0;

    for (const item of chapterFiles) {
      const fullPath = path.join(chaptersDir, item.file);
      if (fs.existsSync(fullPath)) {
        const rawContent = fs.readFileSync(fullPath, 'utf-8');
        const formattedHtml = formatTextToHtml(rawContent);
        const wCount = calculateWordCount(formattedHtml);
        totalWords += wCount;

        const plainText = rawContent.replace(/[\r\n]+/g, ' ');
        const excerpt = plainText.length > 200 ? plainText.substring(0, 197) + '...' : plainText;

        await Chapter.create({
          storyId: story._id,
          title: item.title,
          order: item.order,
          content: formattedHtml,
          excerpt,
          wordCount: wCount,
          isPrologue: item.isPrologue,
        });

        console.log(`  ✓ Seeded Chapter ${item.order}: ${item.title} (${wCount} words)`);
      }
    }

    console.log(`✅ Seeded story "${story.title}" into MongoDB with 9 chapters totaling ${totalWords} words!`);
  } catch (error) {
    console.error('❌ Error in seedInitialData:', error);
  }
};
