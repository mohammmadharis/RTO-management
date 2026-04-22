import { Router } from 'express';
import { authenticate } from '../middleware';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import customerRoutes from './customer.routes';
import serviceRoutes from './service.routes';
import customerServiceRoutes from './customerService.routes';
import paymentRoutes from './payment.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected route — /auth/me needs auth
router.get('/auth/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

// Protected routes
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/services', serviceRoutes);
router.use('/customer-services', customerServiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

export default router;
