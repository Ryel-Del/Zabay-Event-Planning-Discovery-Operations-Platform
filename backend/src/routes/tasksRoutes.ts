import { Router } from 'express';
import { requireOrganizerOrOperator } from '../middleware/auth';
import { getTasks, updateTaskStatus } from '../controllers/tasksController';

const router = Router();

router.get('/', requireOrganizerOrOperator, getTasks);
router.patch('/:id/status', requireOrganizerOrOperator, updateTaskStatus);

export default router;
