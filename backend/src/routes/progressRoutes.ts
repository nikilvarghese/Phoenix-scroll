import { Router } from 'express';
import { saveProgress, getProgress, getUserAllProgress } from '../controllers/progressController.js';
import { optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/user-all', optionalAuthenticate, getUserAllProgress);
router.post('/story/:storyId', optionalAuthenticate, saveProgress);
router.get('/story/:storyId', optionalAuthenticate, getProgress);

export default router;
