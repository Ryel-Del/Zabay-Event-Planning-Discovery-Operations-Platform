import { Router } from 'express';
import { getVenues, getVenueById, bookVenue } from '../controllers/venuesController';

const router = Router();

router.get('/', getVenues);
router.get('/:id', getVenueById);
router.post('/:id/book', bookVenue);

export default router;
