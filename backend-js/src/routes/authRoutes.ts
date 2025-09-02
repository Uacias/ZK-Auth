import express, { Request, Response, NextFunction } from 'express';
import { Surreal } from 'surrealdb';
import { RegisterPayload, LoginPayload } from '../models/user';
import { ZkRegisterStringPayload, ZkLoginStringPayload } from '../models/zkUser';
import { registerUser, loginUser } from '../services/authService';
import { registerUserHashed, loginUserHashed } from '../services/authHashingService';
import { 
  registerZkUserString,
  verifyZkProofString
} from '../services/zkAuthService';
import { ServerError } from '../errors/ServerError';
import { logger } from '../utils/logger';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  db: Surreal;
}

// Middleware to ensure database is available
function requireDb(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.db) {
    return res.status(500).json(ServerError.internalServerError('Database not available').toJSON());
  }
  next();
}

// Traditional auth routes
router.post('/register', requireDb, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload: RegisterPayload = req.body;
    const user = await registerUser(authReq.db, payload);
    res.json(user);
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      logger.error('Unexpected error in /register:', error);
      res.status(500).json(ServerError.internalServerError(String(error)).toJSON());
    }
  }
});

router.post('/login', requireDb, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload: LoginPayload = req.body;
    const result = await loginUser(authReq.db, payload);
    res.json(result);
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      logger.error('Unexpected error in /login:', error);
      res.status(500).json(ServerError.internalServerError(String(error)).toJSON());
    }
  }
});

// Hashed auth routes
router.post('/register_hashed', requireDb, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload: RegisterPayload = req.body;
    const user = await registerUserHashed(authReq.db, payload);
    res.json(user);
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      logger.error('Unexpected error in /register_hashed:', error);
      res.status(500).json(ServerError.internalServerError(String(error)).toJSON());
    }
  }
});

router.post('/login_hashed', requireDb, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload: LoginPayload = req.body;
    const result = await loginUserHashed(authReq.db, payload);
    res.json(result);
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      logger.error('Unexpected error in /login_hashed:', error);
      res.status(500).json(ServerError.internalServerError(String(error)).toJSON());
    }
  }
});


// String ZK auth routes (working version) 
router.post('/zk/register_string', requireDb, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload: ZkRegisterStringPayload = req.body;
    const user = await registerZkUserString(authReq.db, payload);
    res.json(user);
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      logger.error('Unexpected error in /zk/register_string:', error);
      res.status(500).json(ServerError.internalServerError(String(error)).toJSON());
    }
  }
});

router.post('/zk/login_string', requireDb, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload: ZkLoginStringPayload = req.body;
    const result = await verifyZkProofString(authReq.db, payload);
    res.json(result);
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      logger.error('Unexpected error in /zk/login_string:', error);
      res.status(500).json(ServerError.internalServerError(String(error)).toJSON());
    }
  }
});

export default router;