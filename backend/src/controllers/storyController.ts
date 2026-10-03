import { Response } from 'express';
import Story from '../models/Story.js';
import ReadingProgress from '../models/ReadingProgress.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getStories = async (req: AuthRequest, res: Response) => {
  try {
    const isOwner = req.user?.role === 'owner';
    const filter: any = {};

    if (!isOwner) {
      filter.isPublished = true;
      filter.visibility = { $in: ['public', 'unlisted'] };
    }

    const stories = await Story.find(filter).select('-chapters').sort({ updatedAt: -1 });

    const sanitizedStories = stories.map((story) => {
      const obj = story.toObject();
      if (!isOwner) {
        delete obj.accessPasscode;
      }
      return obj;
    });

    res.json(sanitizedStories);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch stories.' });
  }
};

export const getStoryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    const isOwner = req.user?.role === 'owner' || (story.ownerId && req.user?.id === story.ownerId.toString());

    if (!isOwner) {
      if (!story.isPublished) {
        return res.status(403).json({ message: 'This story is currently a private draft.' });
      }
      if (story.visibility === 'private') {
        return res.status(403).json({ message: 'This story is private to the author.' });
      }
      if (story.accessPasscode) {
        const providedPasscode = req.headers['x-story-passcode'] || req.query.passcode;
        if (providedPasscode !== story.accessPasscode) {
          return res.status(401).json({
            message: 'This story is passcode protected.',
            requiresPasscode: true,
            title: story.title,
            authorName: story.authorName,
            coverImage: story.coverImage,
          });
        }
      }
    }

    const obj = story.toObject();
    if (!isOwner) {
      delete obj.accessPasscode;
    }

    res.json(obj);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch story details.' });
  }
};

export const verifyPasscode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { passcode } = req.body;
    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    if (!story.accessPasscode || story.accessPasscode === passcode) {
      return res.json({ success: true, message: 'Passcode verified successfully.' });
    } else {
      return res.status(401).json({ success: false, message: 'Incorrect passcode.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Passcode verification failed.' });
  }
};

export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const { title, subtitle, description, authorName, visibility, accessPasscode, genre, coverImage } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const story = await Story.create({
      title,
      subtitle: subtitle || '',
      description,
      authorName: authorName || req.user?.email || 'Anonymous Author',
      coverImage: coverImage || '',
      visibility: visibility || 'private',
      accessPasscode: accessPasscode || '',
      genre: genre || 'Fiction',
      ownerId: req.user!.id,
      isPublished: false,
    });

    res.status(201).json(story);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create story.' });
  }
};

export const updateStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    const isAuthor = req.user?.role === 'owner' || (story.ownerId && story.ownerId.toString() === req.user!.id);
    if (!isAuthor) {
      return res.status(403).json({ message: 'You are not authorized to edit this story.' });
    }

    const fields = ['title', 'subtitle', 'description', 'authorName', 'coverImage', 'visibility', 'accessPasscode', 'genre', 'isPublished'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (story as any)[field] = req.body[field];
      }
    });

    if (req.body.isPublished && !story.publishedAt) {
      story.publishedAt = new Date();
    }

    await story.save();
    res.json(story);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update story.' });
  }
};

export const deleteStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    const isAuthor = req.user?.role === 'owner' || (story.ownerId && story.ownerId.toString() === req.user!.id);
    if (!isAuthor) {
      return res.status(403).json({ message: 'You are not authorized to delete this story.' });
    }

    // Cascading deletion from MongoDB: Delete associated reading progress
    await ReadingProgress.deleteMany({ storyId: story._id });
    await story.deleteOne();

    console.log(`🗑️ Story deleted cleanly from database: ${story.title} (${story._id})`);

    res.json({ message: 'Story, chapters, and reading data successfully deleted from database.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete story.' });
  }
};

export const togglePublishStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    const isAuthor = req.user?.role === 'owner' || (story.ownerId && story.ownerId.toString() === req.user!.id);
    if (!isAuthor) {
      return res.status(403).json({ message: 'You are not authorized to modify this story status.' });
    }

    story.isPublished = !story.isPublished;
    if (story.isPublished && !story.publishedAt) {
      story.publishedAt = new Date();
    }

    await story.save();
    res.json(story);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to toggle publication state.' });
  }
};
