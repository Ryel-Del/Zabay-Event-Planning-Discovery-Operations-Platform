import { Router } from 'express';
import eventsRoutes from './eventsRoutes';
import venuesRoutes from './venuesRoutes';
import tasksRoutes from './tasksRoutes';
import attendeesRoutes from './attendeesRoutes';

const apiRouter = Router();

apiRouter.use('/events', eventsRoutes);
apiRouter.use('/venues', venuesRoutes);
apiRouter.use('/tasks', tasksRoutes);
apiRouter.use('/attendees', attendeesRoutes);

export default apiRouter;
