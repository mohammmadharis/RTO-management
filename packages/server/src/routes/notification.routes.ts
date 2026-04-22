import { Router, Request, Response, NextFunction } from 'express';
import { sendNotificationSchema, paginationSchema } from '@rto/shared';
import { authenticate, validate } from '../middleware';
import { NotificationService } from '../services';

const router = Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', validate(paginationSchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as any;
    const result = await NotificationService.list(page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await NotificationService.getStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/send
router.post('/send', validate(sendNotificationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await NotificationService.send(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
});

export default router;
