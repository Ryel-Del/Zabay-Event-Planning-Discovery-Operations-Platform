import { Router } from 'express';
import { requireOrganizerOrVenueManagerOrOperator, requireVenueCreator } from '../middleware/auth';
import { getVenues, getVenueById, bookVenue, createVenue } from '../controllers/venuesController';

const router = Router();

router.get('/', getVenues);
router.post('/', requireVenueCreator, createVenue);
router.get('/:id', getVenueById);
router.post('/:id/book', requireOrganizerOrVenueManagerOrOperator, bookVenue);

export default router;

