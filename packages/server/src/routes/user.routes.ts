import { Router, Request, Response, NextFunction } from 'express';
import { createUserSchema, updateUserSchema } from '@rto/shared';
import { authenticate, authorize, validate } from '../middleware';
import { UserService } from '../services';

const router = Router();

// All user management routes require Admin role
router.use(authenticate, authorize('ADMIN'));

// GET /api/users
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserService.list();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.getById(req.params.id as string);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post('/', validate(createUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id
router.patch('/:id', validate(updateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.update(req.params.id as string, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await UserService.delete(req.params.id as string);
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
});

export default router;
