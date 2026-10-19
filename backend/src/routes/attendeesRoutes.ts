import { Router } from 'express';
import { checkInAttendee, registerForEvent } from '../controllers/attendeesController';

const router = Router();

router.post('/checkin', checkInAttendee);
router.post('/register', registerForEvent);

export default router;
