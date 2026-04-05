import express from 'express';
import { SessionData } from '@/services/SessionService';
import type { User } from '@workos-inc/node';

declare global {
  namespace Express {
    export interface Request {
      jwtData: any;
      originalToken: string;
      clientIp?: string;

      // WorkOS AuthKit authenticated user
      workosUser?: User;

      // sessionData is defined in SessionService outside of the http layer for each
      sessionData: SessionData
    }
  }
}

type NodegenRequest = express.Request;
export default NodegenRequest;
