import { Router } from 'express';
import { requireOperator } from '../middleware/auth';
import { getEvents, getEventById, createEvent } from '../controllers/eventsController';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', requireOperator, createEvent);

export default router;
