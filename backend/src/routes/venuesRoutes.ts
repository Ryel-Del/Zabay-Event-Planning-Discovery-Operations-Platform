import { Router } from 'express';
import { requireOperator } from '../middleware/auth';
import { getVenues, getVenueById, bookVenue } from '../controllers/venuesController';

const router = Router();

router.get('/', getVenues);
router.get('/:id', getVenueById);
router.post('/:id/book', requireOperator, bookVenue);

export default router;
