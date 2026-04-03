import express from 'express';
import { NotFoundException } from '@/http/nodegen/errors';

/**
 * Default 404 handler for the express app
 */
export default () => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    return next(new NotFoundException('Route not found'));
  };
}
