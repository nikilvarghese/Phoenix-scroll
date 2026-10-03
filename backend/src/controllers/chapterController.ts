import { Response } from 'express';
import mongoose from 'mongoose';
import Story from '../models/Story.js';
import ReadingProgress from '../models/ReadingProgress.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { sanitizeChapterContent, calculateWordCount, calculateReadingTime } from '../utils/sanitize.js';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const recalculateStoryStats = (story: any) => {
  let totalWordCount = 0;
  story.chapters.forEach((ch: any) => {
    totalWordCount += ch.wordCount || 0;
  });
  story.chapterCount = story.chapters.length;
  story.readingTimeMinutes = calculateReadingTime(totalWordCount);
};

const formatChapter = (storyId: any, ch: any) => {
  const obj = ch.toObject ? ch.toObject() : { ...ch };
  return {
    ...obj,
    storyId: storyId.toString(),
  };
};

const formatRawTextToHtml = (rawText: string): string => {
  const paragraphs = rawText.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  return paragraphs
    .map((p) => {
      const cleanP = p.replace(/\r?\n/g, ' ');
      return `<p>${cleanP}</p>`;
    })
    .join('\n');
};

const checkStoryAccess = (story: any, req: AuthRequest) => {
  if (!story) {
    return { authorized: false, status: 404, message: 'Story not found.' };
  }

  const isOwner = req.user?.role === 'owner' || (story.ownerId && req.user?.id === story.ownerId.toString());

  if (!isOwner) {
    if (!story.isPublished) {
      return { authorized: false, status: 403, message: 'This story is currently a private draft.' };
    }
    if (story.visibility === 'private') {
      return { authorized: false, status: 403, message: 'This story is private to the author.' };
    }
    if (story.accessPasscode) {
      const providedPasscode = req.headers['x-story-passcode'] || req.query.passcode;
      if (providedPasscode !== story.accessPasscode) {
        return { authorized: false, status: 401, message: 'This story is passcode protected.' };
      }
    }
  }

  return { authorized: true, story };
};

export const getChaptersByStory = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findById(storyId);

    const access = checkStoryAccess(story, req);
    if (!access.authorized) {
      return res.status(access.status!).json({ message: access.message });
    }

    const sortedChapters = [...(story!.chapters || [])].sort((a, b) => a.order - b.order);
    const formatted = sortedChapters.map((ch) => formatChapter(story!._id, ch));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch chapters.' });
  }
};

export const getChapterById = async (req: AuthRequest, res: Response) => {
  try {
    const { chapterId } = req.params;

    const story = await Story.findOne({ 'chapters._id': chapterId });
    if (!story) {
      return res.status(404).json({ message: 'Chapter not found.' });
    }

    const access = checkStoryAccess(story, req);
    if (!access.authorized) {
      return res.status(access.status!).json({ message: access.message });
    }

    const chapter = story.chapters.id(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found.' });
    }

    res.json(formatChapter(story._id, chapter));
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch chapter.' });
  }
};

export const createChapter = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const { title, content, excerpt, illustrationUrl, isPrologue } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    if (story.ownerId.toString() !== req.user!.id && req.user?.role !== 'owner') {
      return res.status(403).json({ message: 'Not authorized to add chapters to this story.' });
    }

    let maxOrder = 0;
    story.chapters.forEach((ch) => {
      if (ch.order > maxOrder) maxOrder = ch.order;
    });

    const nextOrder = maxOrder + 1;
    const sanitizedHtml = sanitizeChapterContent(content || '');
    const wordCount = calculateWordCount(sanitizedHtml);

    const newChapterId = new mongoose.Types.ObjectId();
    const newChapter: any = {
      _id: newChapterId,
      title: title || `Chapter ${nextOrder}`,
      order: nextOrder,
      content: sanitizedHtml,
      excerpt: excerpt || '',
      illustrationUrl: illustrationUrl || '',
      wordCount,
      isPrologue: Boolean(isPrologue),
    };

    story.chapters.push(newChapter);
    recalculateStoryStats(story);
    await story.save();

    const createdChapter = story.chapters.id(newChapterId);
    res.status(201).json(formatChapter(story._id, createdChapter));
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create chapter.' });
  }
};

export const updateChapter = async (req: AuthRequest, res: Response) => {
  try {
    const { chapterId } = req.params;
    const { title, content, excerpt, illustrationUrl, order, isPrologue } = req.body;

    const story = await Story.findOne({ 'chapters._id': chapterId });
    if (!story) {
      return res.status(404).json({ message: 'Chapter not found.' });
    }

    const isAuthor = req.user?.role === 'owner' || (story.ownerId && story.ownerId.toString() === req.user!.id);
    if (!isAuthor) {
      return res.status(403).json({ message: 'Not authorized to update this chapter.' });
    }

    const chapter = story.chapters.id(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found.' });
    }

    if (title !== undefined) chapter.title = title;
    if (excerpt !== undefined) chapter.excerpt = excerpt;
    if (illustrationUrl !== undefined) chapter.illustrationUrl = illustrationUrl;
    if (order !== undefined) chapter.order = order;
    if (isPrologue !== undefined) chapter.isPrologue = Boolean(isPrologue);

    if (content !== undefined) {
      const sanitizedHtml = sanitizeChapterContent(content);
      chapter.content = sanitizedHtml;
      chapter.wordCount = calculateWordCount(sanitizedHtml);
    }

    recalculateStoryStats(story);
    await story.save();

    res.json(formatChapter(story._id, chapter));
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update chapter.' });
  }
};

export const reorderChapters = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const { chapterOrders } = req.body; // Array of { chapterId, order, title?, isPrologue? }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    const isAuthor = req.user?.role === 'owner' || (story.ownerId && story.ownerId.toString() === req.user!.id);
    if (!isAuthor) {
      return res.status(403).json({ message: 'Not authorized to reorder chapters.' });
    }

    if (!Array.isArray(chapterOrders)) {
      return res.status(400).json({ message: 'Invalid payload: chapterOrders must be an array.' });
    }

    for (const item of chapterOrders) {
      const ch = story.chapters.id(item.chapterId);
      if (ch) {
        if (item.order !== undefined) ch.order = item.order;
        if (item.title !== undefined) ch.title = item.title;
        if (item.isPrologue !== undefined) ch.isPrologue = item.isPrologue;
      }
    }

    story.chapters.sort((a, b) => a.order - b.order);
    recalculateStoryStats(story);
    await story.save();

    const formatted = story.chapters.map((ch) => formatChapter(story._id, ch));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reorder chapters.' });
  }
};

export const deleteChapter = async (req: AuthRequest, res: Response) => {
  try {
    const { chapterId } = req.params;

    const story = await Story.findOne({ 'chapters._id': chapterId });
    if (!story) {
      return res.status(404).json({ message: 'Chapter not found.' });
    }

    const isAuthor = req.user?.role === 'owner' || (story.ownerId && story.ownerId.toString() === req.user!.id);
    if (!isAuthor) {
      return res.status(403).json({ message: 'Not authorized to delete this chapter.' });
    }

    story.chapters.pull({ _id: chapterId });
    await ReadingProgress.deleteMany({ chapterId });

    recalculateStoryStats(story);
    await story.save();

    res.json({ message: 'Chapter and associated reading progress deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete chapter.' });
  }
};

export const importDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No document file uploaded.' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    const isAuthor = req.user?.role === 'owner' || (story.ownerId && story.ownerId.toString() === req.user!.id);
    if (!isAuthor) {
      return res.status(403).json({ message: 'Not authorized to import documents into this story.' });
    }

    let extractedText = '';
    const ext = file.originalname.toLowerCase();

    if (ext.endsWith('.pdf')) {
      const uint8 = new Uint8Array(file.buffer);
      const parser = new PDFParse(uint8);
      const parsed = await parser.getText();
      extractedText = parsed.text || '';
    } else if (ext.endsWith('.docx') || ext.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value || '';
    } else {
      extractedText = file.buffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ message: 'Could not extract text from the provided file.' });
    }

    // Split text into chapters using PROLOGUE and CHAPTER markers
    const chapterMatches = [...extractedText.matchAll(/(PROLOGUE|CHAPTER\s+\d+|Chapter\s+\d+)/gi)];

    const parsedChapters: { title: string; content: string; isPrologue: boolean }[] = [];

    if (chapterMatches.length > 0) {
      chapterMatches.forEach((m, idx) => {
        const start = m.index!;
        const end = idx + 1 < chapterMatches.length ? chapterMatches[idx + 1].index! : extractedText.length;
        const chunk = extractedText.slice(start, end).trim();
        const firstLineEnd = chunk.indexOf('\n');
        let headerLine = firstLineEnd !== -1 ? chunk.substring(0, firstLineEnd).trim() : chunk;
        let bodyText = firstLineEnd !== -1 ? chunk.substring(firstLineEnd).trim() : chunk;

        const isPrologue = headerLine.toUpperCase().includes('PROLOGUE');

        let title = headerLine;
        const dashMatch = headerLine.match(/—|–|-/);
        if (dashMatch && dashMatch.index) {
          title = headerLine.substring(dashMatch.index + 1).trim();
        }

        parsedChapters.push({
          title: title || headerLine,
          content: formatRawTextToHtml(bodyText),
          isPrologue,
        });
      });
    } else {
      const cleanFileName = file.originalname.replace(/\.[^/.]+$/, '');
      parsedChapters.push({
        title: cleanFileName,
        content: formatRawTextToHtml(extractedText),
        isPrologue: false,
      });
    }

    let maxOrder = 0;
    story.chapters.forEach((ch) => {
      if (ch.order > maxOrder) maxOrder = ch.order;
    });

    let currentOrder = maxOrder + 1;

    for (const item of parsedChapters) {
      const sanitizedHtml = sanitizeChapterContent(item.content);
      const wCount = calculateWordCount(sanitizedHtml);
      const plain = item.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

      story.chapters.push({
        _id: new mongoose.Types.ObjectId(),
        title: item.title,
        order: currentOrder++,
        content: sanitizedHtml,
        excerpt: plain.length > 200 ? plain.substring(0, 197) + '...' : plain,
        wordCount: wCount,
        isPrologue: item.isPrologue,
      } as any);
    }

    recalculateStoryStats(story);
    await story.save();

    const formatted = story.chapters.map((ch) => formatChapter(story._id, ch));

    res.status(201).json({
      message: `Successfully imported ${parsedChapters.length} chapter(s) from document.`,
      chapters: formatted,
    });
  } catch (err: any) {
    console.error('Import document error:', err);
    res.status(500).json({ message: err.message || 'Failed to import document.' });
  }
};
