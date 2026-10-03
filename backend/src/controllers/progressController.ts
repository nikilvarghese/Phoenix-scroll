import { Response } from 'express';
import ReadingProgress from '../models/ReadingProgress.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const saveProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const { clientDeviceId, chapterId, chapterOrder, scrollPercentage, isCompleted } = req.body;

    if (!clientDeviceId || !chapterId) {
      return res.status(400).json({ message: 'Client device ID and chapter ID are required.' });
    }

    const userId = req.user?.id;

    const updateData: any = {
      userId,
      chapterId,
      chapterOrder: chapterOrder || 1,
      scrollPercentage: scrollPercentage || 0,
      lastReadAt: new Date(),
    };

    if (typeof isCompleted === 'boolean') {
      updateData.isCompleted = isCompleted;
    }

    const progress = await ReadingProgress.findOneAndUpdate(
      { clientDeviceId, storyId },
      updateData,
      { upsert: true, new: true }
    );

    res.json(progress);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to save reading progress.' });
  }
};

export const getProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const clientDeviceId = (req.query.clientDeviceId as string) || req.headers['x-client-device-id'];

    if (!clientDeviceId) {
      return res.status(400).json({ message: 'Client device ID required.' });
    }

    const progress = await ReadingProgress.findOne({ clientDeviceId, storyId });
    if (!progress) {
      return res.status(404).json({ message: 'No reading progress found.' });
    }

    res.json(progress);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch reading progress.' });
  }
};

export const getUserAllProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const clientDeviceId = (req.query.clientDeviceId as string) || (req.headers['x-client-device-id'] as string);

    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else if (clientDeviceId) {
      query.clientDeviceId = clientDeviceId;
    } else {
      return res.json([]);
    }

    const progressList = await ReadingProgress.find(query)
      .populate('storyId', 'title subtitle authorName coverImage chapterCount isPublished visibility ownerId readingTimeMinutes genre')
      .populate('chapterId', 'title order')
      .sort({ lastReadAt: -1 });

    const isOwner = req.user?.role === 'owner';
    const filteredList = progressList.filter((item) => {
      if (!item.storyId) return false;
      const storyObj = item.storyId as any;
      if (isOwner) return true;
      if (storyObj.ownerId && req.user?.id === storyObj.ownerId.toString()) return true;
      if (!storyObj.isPublished) return false;
      if (storyObj.visibility === 'private') return false;
      return true;
    });

    res.json(filteredList);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch user reading progress list.' });
  }
};
