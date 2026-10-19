import { Router } from 'express';
import { getTasks, updateTaskStatus } from '../controllers/tasksController';

const router = Router();

router.get('/', getTasks);
router.patch('/:id/status', updateTaskStatus);

export default router;
