import { Router } from 'express';
import {
  getStories,
  getStoryById,
  verifyPasscode,
  createStory,
  updateStory,
  deleteStory,
  togglePublishStory,
} from '../controllers/storyController.js';
import { optionalAuthenticate, authenticate, requireOwner } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalAuthenticate, getStories);
router.get('/:id', optionalAuthenticate, getStoryById);
router.post('/:id/passcode', verifyPasscode);

// Owner protected routes
router.post('/', authenticate, requireOwner, createStory);
router.put('/:id', authenticate, requireOwner, updateStory);
router.delete('/:id', authenticate, requireOwner, deleteStory);
router.patch('/:id/publish', authenticate, requireOwner, togglePublishStory);

export default router;
