import { Router } from 'express';
import { requireOperator } from '../middleware/auth';
import { checkInAttendee, registerForEvent } from '../controllers/attendeesController';

const router = Router();

router.post('/checkin', requireOperator, checkInAttendee);
router.post('/register', registerForEvent);

export default router;
