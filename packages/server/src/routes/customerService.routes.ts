import { Router, Request, Response, NextFunction } from 'express';
import { createCustomerServiceSchema, updateCustomerServiceSchema, customerServiceFilterSchema } from '@rto/shared';
import { authenticate, validate } from '../middleware';
import { CustomerServiceService } from '../services';

const router = Router();

router.use(authenticate);

// GET /api/customer-services
router.get('/', validate(customerServiceFilterSchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CustomerServiceService.list(req.query as any);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/customer-services/expiring
router.get('/expiring', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const data = await CustomerServiceService.getExpiring(days);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/customer-services/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cs = await CustomerServiceService.getById(req.params.id as string);
    res.json({ success: true, data: cs });
  } catch (err) {
    next(err);
  }
});

// POST /api/customer-services
router.post('/', validate(createCustomerServiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cs = await CustomerServiceService.create({
      ...req.body,
      createdById: req.user!.id,
    });
    res.status(201).json({ success: true, data: cs });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/customer-services/:id
router.patch('/:id', validate(updateCustomerServiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cs = await CustomerServiceService.update(req.params.id as string, req.body);
    res.json({ success: true, data: cs });
  } catch (err) {
    next(err);
  }
});

export default router;
