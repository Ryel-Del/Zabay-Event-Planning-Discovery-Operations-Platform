import { Router } from 'express';
import { requireOrganizerOrOperator } from '../middleware/auth';
import { checkInAttendee, registerForEvent } from '../controllers/attendeesController';

const router = Router();

router.post('/checkin', requireOrganizerOrOperator, checkInAttendee);
router.post('/register', registerForEvent);

export default router;
