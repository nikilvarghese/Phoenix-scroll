import mongoose from 'mongoose';
import Story from '../models/Story.js';

/**
 * Automatically migrates existing separate chapter collection documents into embedded
 * story.chapters arrays inside each Story document, consolidating database storage.
 */
export const migrateChaptersToStories = async () => {
  try {
    if (!mongoose.connection.db) return;

    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasChapterCollection = collections.some((c) => c.name === 'chapters');

    if (!hasChapterCollection) return;

    const legacyChapterCol = mongoose.connection.db.collection('chapters');
    const legacyChapters = await legacyChapterCol.find({}).toArray();

    if (legacyChapters.length === 0) {
      await legacyChapterCol.drop().catch(() => {});
      return;
    }

    console.log(`📦 Found ${legacyChapters.length} chapters to consolidate into Story files...`);

    for (const ch of legacyChapters) {
      if (!ch.storyId) continue;

      const story = await Story.findById(ch.storyId);
      if (story) {
        // Check if chapter already exists in story.chapters
        const exists = story.chapters.some((existingCh: any) => existingCh._id.toString() === ch._id.toString());
        if (!exists) {
          story.chapters.push({
            _id: ch._id,
            title: ch.title || 'Untitled Chapter',
            order: ch.order || 1,
            content: ch.content || '',
            excerpt: ch.excerpt || '',
            illustrationUrl: ch.illustrationUrl || '',
            wordCount: ch.wordCount || 0,
            isPrologue: Boolean(ch.isPrologue),
            createdAt: ch.createdAt || new Date(),
            updatedAt: ch.updatedAt || new Date(),
          } as any);

          let totalWords = 0;
          story.chapters.forEach((item: any) => {
            totalWords += item.wordCount || 0;
          });
          story.chapterCount = story.chapters.length;
          story.readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

          await story.save();
        }
      }
    }

    // Drop legacy separate chapters collection once all documents are consolidated into Story documents
    await legacyChapterCol.drop().catch(() => {});
    console.log('✅ Successfully consolidated all chapters into single Story documents and cleaned up legacy chapters collection.');
  } catch (err: any) {
    console.error('Error migrating chapters to story files:', err.message);
  }
};
