import { Router } from 'express';
import { requireOperator } from '../middleware/auth';
import { getTasks, updateTaskStatus } from '../controllers/tasksController';

const router = Router();

router.get('/', requireOperator, getTasks);
router.patch('/:id/status', requireOperator, updateTaskStatus);

export default router;
