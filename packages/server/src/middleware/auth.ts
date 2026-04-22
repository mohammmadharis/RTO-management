import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env, prisma, logger } from '../config';

export interface AuthPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        name: string;
        email: string;
      };
    }
  }
}

/**
 * Verify JWT access token from Authorization header.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    prisma.user
      .findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, name: true, email: true, isActive: true },
      })
      .then((user) => {
        if (!user || !user.isActive) {
          res.status(401).json({ success: false, message: 'User not found or inactive' });
          return;
        }
        req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
        next();
      })
      .catch((err) => {
        logger.error('Auth middleware DB error', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
      });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Role-based authorization middleware.
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
