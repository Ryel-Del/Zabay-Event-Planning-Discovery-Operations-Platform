import { Router } from 'express';
import { requireEventCreator, requireOrganizerOrOperator } from '../middleware/auth';
import { getEventRegistrationRoster, getEventRegistrationSummary } from '../controllers/eventRegistrationsController';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent, getEventAnalytics } from '../controllers/eventsController';

const router = Router();

router.get('/', getEvents);
router.get('/:id/registrations', requireOrganizerOrOperator, getEventRegistrationRoster);
router.get('/:id/registration-summary', requireOrganizerOrOperator, getEventRegistrationSummary);
router.get('/:id/analytics', requireOrganizerOrOperator, getEventAnalytics);
router.get('/:id', getEventById);
router.post('/', requireEventCreator, createEvent);
router.patch('/:id', requireEventCreator, updateEvent);
router.delete('/:id', requireEventCreator, deleteEvent);

export default router;
