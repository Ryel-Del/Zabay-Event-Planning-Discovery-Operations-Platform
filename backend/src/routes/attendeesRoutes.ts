import { Router } from 'express';
import { requireEventGateOwnership } from '../middleware/requireEventGateOwnership';
import { requireOrganizerOrOperator, requireGateCheckInAuthorized, requireUser, verifyRegistrationMode } from '../middleware/auth';
import { checkInAttendee, getMyRegistrations, registerForEvent, getRegistrations } from '../controllers/attendeesController';

const router = Router();

router.get('/', getRegistrations);
router.post('/checkin', requireGateCheckInAuthorized, requireEventGateOwnership, checkInAttendee);
router.post('/register', verifyRegistrationMode, registerForEvent);
router.get('/registrations/me', requireUser, getMyRegistrations);

export default router;
