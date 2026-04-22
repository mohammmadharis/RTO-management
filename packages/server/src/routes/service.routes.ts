import { Router, Request, Response, NextFunction } from 'express';
import { createServiceSchema, updateServiceSchema } from '@rto/shared';
import { authenticate, authorize, validate } from '../middleware';
import { ServiceMasterService } from '../services';

const router = Router();

router.use(authenticate);

// GET /api/services
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await ServiceMasterService.list();
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
});

// GET /api/services/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await ServiceMasterService.getById(req.params.id as string);
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
});

// POST /api/services (Admin only)
router.post('/', authorize('ADMIN'), validate(createServiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await ServiceMasterService.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/services/:id (Admin only)
router.patch('/:id', authorize('ADMIN'), validate(updateServiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await ServiceMasterService.update(req.params.id as string, req.body);
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
});

export default router;
