import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware';
import { DashboardService } from '../services';

const router = Router();

router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await DashboardService.getSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
