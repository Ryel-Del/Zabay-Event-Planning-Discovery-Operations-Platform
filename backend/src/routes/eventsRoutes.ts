import { Router } from 'express';
import { requireEventCreator } from '../middleware/auth';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/eventsController';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', requireEventCreator, createEvent);
router.patch('/:id', requireEventCreator, updateEvent);
router.delete('/:id', requireEventCreator, deleteEvent);

export default router;
