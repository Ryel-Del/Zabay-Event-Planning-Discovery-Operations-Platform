import { Router } from 'express';
import { requireEventCreator } from '../middleware/auth';
import { getEvents, getEventById, createEvent } from '../controllers/eventsController';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', requireEventCreator, createEvent);

export default router;
