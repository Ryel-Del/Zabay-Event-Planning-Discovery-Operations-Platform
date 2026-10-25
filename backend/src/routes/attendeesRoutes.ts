import { Router } from 'express';
import { requireOrganizerOrOperator, requireUser } from '../middleware/auth';
import { checkInAttendee, getMyRegistrations, registerForEvent } from '../controllers/attendeesController';

const router = Router();

router.post('/checkin', requireOrganizerOrOperator, checkInAttendee);
router.post('/register', registerForEvent);
router.get('/registrations/me', requireUser, getMyRegistrations);

export default router;
