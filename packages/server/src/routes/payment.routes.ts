import { Router, Request, Response, NextFunction } from 'express';
import { createPaymentSchema, paymentFilterSchema } from '@rto/shared';
import { authenticate, validate } from '../middleware';
import { PaymentService } from '../services';

const router = Router();

router.use(authenticate);

// GET /api/payments
router.get('/', validate(paymentFilterSchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PaymentService.list(req.query as any);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/overdue
router.get('/overdue', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await PaymentService.getOverdue();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/summary
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };
    const data = await PaymentService.getSummary(dateFrom, dateTo);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments
router.post('/', validate(createPaymentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await PaymentService.create({
      ...req.body,
      receivedById: req.user!.id,
    });
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

export default router;
