import { Router } from 'express';
import { requireEventCreator } from '../middleware/auth';
import { getEvents, getEventById, createEvent } from '../controllers/eventsController';
import { getEventRegistrations } from '../controllers/eventRegistrationsController';
import { requireOrganizerOrOperator } from '../middleware/auth';

const router = Router();

router.get('/', getEvents);
router.get('/:id/registrations', requireOrganizerOrOperator, getEventRegistrations);
router.get('/:id', getEventById);
router.post('/', requireEventCreator, createEvent);

export default router;
