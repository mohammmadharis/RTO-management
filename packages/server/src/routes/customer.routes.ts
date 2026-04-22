import { Router, Request, Response, NextFunction } from 'express';
import { createCustomerSchema, updateCustomerSchema, customerFilterSchema } from '@rto/shared';
import { authenticate, validate } from '../middleware';
import { CustomerService } from '../services';

const router = Router();

router.use(authenticate);

// GET /api/customers
router.get('/', validate(customerFilterSchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CustomerService.list(req.query as any);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.getById(req.params.id as string);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers
router.post('/', validate(createCustomerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.create({
      ...req.body,
      createdById: req.user!.id,
    });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/customers/:id
router.patch('/:id', validate(updateCustomerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.update(req.params.id as string, req.body);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CustomerService.delete(req.params.id as string);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers/bulk-import
router.post('/bulk-import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, error: 'rows array is required and must not be empty' });
      return;
    }
    if (rows.length > 3000) {
      res.status(400).json({ success: false, error: 'Maximum 3000 rows per import' });
      return;
    }
    const result = await CustomerService.bulkImport(rows, req.user!.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
