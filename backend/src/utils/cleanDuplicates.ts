import ReadingProgress from '../models/ReadingProgress.js';

/**
 * One-time utility to automatically clean up existing legacy duplicate reading progress records
 * in MongoDB Atlas, keeping only the latest progress entry per user/device per story.
 */
export const cleanDuplicateProgress = async () => {
  try {
    const allProgress = await ReadingProgress.find().sort({ lastReadAt: -1 });
    const seenUserStory = new Set<string>();
    const seenDeviceStory = new Set<string>();
    const idsToDelete: string[] = [];

    for (const item of allProgress) {
      const sId = item.storyId ? item.storyId.toString() : '';
      if (!sId) continue;

      if (item.userId) {
        const uKey = `${item.userId.toString()}_${sId}`;
        if (seenUserStory.has(uKey)) {
          idsToDelete.push(item._id.toString());
        } else {
          seenUserStory.add(uKey);
        }
      } else if (item.clientDeviceId) {
        const dKey = `${item.clientDeviceId}_${sId}`;
        if (seenDeviceStory.has(dKey)) {
          idsToDelete.push(item._id.toString());
        } else {
          seenDeviceStory.add(dKey);
        }
      }
    }

    if (idsToDelete.length > 0) {
      await ReadingProgress.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`🧹 Cleaned up ${idsToDelete.length} legacy duplicate reading progress record(s) from MongoDB.`);
    }
  } catch (err: any) {
    console.error('Error cleaning duplicate reading progress:', err.message);
  }
};
