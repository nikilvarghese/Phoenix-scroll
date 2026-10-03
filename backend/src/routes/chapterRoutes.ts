import { Router } from 'express';
import {
  getChaptersByStory,
  getChapterById,
  createChapter,
  updateChapter,
  reorderChapters,
  deleteChapter,
  importDocument,
} from '../controllers/chapterController.js';
import { optionalAuthenticate, authenticate, requireOwner } from '../middleware/authMiddleware.js';
import { uploadDocument } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/story/:storyId', optionalAuthenticate, getChaptersByStory);
router.get('/:chapterId', optionalAuthenticate, getChapterById);

// Owner protected routes
router.post('/story/:storyId', authenticate, requireOwner, createChapter);
router.put('/:chapterId', authenticate, requireOwner, updateChapter);
router.post('/story/:storyId/reorder', authenticate, requireOwner, reorderChapters);
router.delete('/:chapterId', authenticate, requireOwner, deleteChapter);
router.post('/story/:storyId/import-document', authenticate, requireOwner, uploadDocument.single('document'), importDocument);

export default router;
