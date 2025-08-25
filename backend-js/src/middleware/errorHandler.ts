import { Request, Response, NextFunction } from 'express';
import { ServerError } from '../errors/ServerError';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ServerError) {
    res.status(error.statusCode).json(error.toJSON());
  } else {
    logger.error('Unexpected error:', error);
    const serverError = ServerError.internalServerError('An unexpected error occurred');
    res.status(500).json(serverError.toJSON());
  }
}