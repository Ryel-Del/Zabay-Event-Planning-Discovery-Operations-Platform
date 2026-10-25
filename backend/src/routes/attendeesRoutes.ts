import { Router } from 'express';
import { requireOrganizerOrOperator, requireUser, verifyRegistrationMode } from '../middleware/auth';
import { checkInAttendee, getMyRegistrations, registerForEvent } from '../controllers/attendeesController';

const router = Router();

router.post('/checkin', requireOrganizerOrOperator, checkInAttendee);
router.post('/register', verifyRegistrationMode, registerForEvent);
router.get('/registrations/me', requireUser, getMyRegistrations);

export default router;
