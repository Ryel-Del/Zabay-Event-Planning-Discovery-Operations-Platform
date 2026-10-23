import { Router } from 'express';
import eventsRoutes from './eventsRoutes';
import venuesRoutes from './venuesRoutes';
import tasksRoutes from './tasksRoutes';
import attendeesRoutes from './attendeesRoutes';
import { authRouter } from '../middleware/auth';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/events', eventsRoutes);
apiRouter.use('/venues', venuesRoutes);
apiRouter.use('/tasks', tasksRoutes);
apiRouter.use('/attendees', attendeesRoutes);

export default apiRouter;
