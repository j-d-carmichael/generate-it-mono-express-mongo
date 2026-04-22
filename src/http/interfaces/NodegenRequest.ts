import express from 'express';
import type { User } from '@workos-inc/node';

declare global {
  namespace Express {
    export interface Request {
      jwtData: any;
      originalToken: string;
      clientIp?: string;

      // WorkOS AuthKit authenticated user
      workosUser?: User;
    }
  }
}

type NodegenRequest = express.Request;
export default NodegenRequest;
