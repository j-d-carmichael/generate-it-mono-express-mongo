import express from 'express';
import NodegenRequest from '@/http/interfaces/NodegenRequest';
import WorkOsService from '@/services/WorkOsService';

export interface ValidateRequestOptions {
  passThruWithoutJWT: boolean;
}

class AccessTokenService {
  /**
   * Used by the validateRequest method
   * @param res
   * @param e
   * @param msg
   */
  private denyRequest(
    res: express.Response,
    e = 'AccessTokenService: authentication failed',
    msg = 'Invalid or missing auth session',
  ): void {
    console.error(e);
    res.status(401).json({
      message: msg,
    });
  }

  /**
   * Validates the request using a WorkOS AuthKit sealed session cookie.
   *
   * If the session is valid the authenticated WorkOS User is attached to
   * `req.workosUser` (and `req.jwtData` for backward compatibility).
   *
   * When the session has expired the method will attempt a transparent
   * refresh and update the session cookie on the response.
   *
   * The `headerNames` parameter is kept for interface compatibility with
   * the generated route template but is not used — authentication is
   * cookie-based via the `wos-session` cookie set by the /auth/callback
   * endpoint.
   *
   * @param req
   * @param res
   * @param next
   * @param headerNames  – retained for template compatibility
   * @param options
   */
  public async validateRequest(
    req: NodegenRequest,
    res: express.Response,
    next: express.NextFunction,
    headerNames: string[],
    options?: ValidateRequestOptions
  ): Promise<void> {
    const sessionData = req.cookies?.['wos-session'];

    if (!sessionData) {
      if (options?.passThruWithoutJWT) {
        return next();
      }
      return this.denyRequest(res, 'No WorkOS session cookie found', 'No auth session provided.');
    }

    try {
      const session = WorkOsService.loadSealedSession(sessionData);

      const authResult = await session.authenticate();

      if (authResult.authenticated) {
        req.workosUser = authResult.user;
        req.jwtData = authResult.user;
        req.originalToken = sessionData;
        return next();
      }

      // Session exists but is not valid — attempt a refresh
      try {
        const refreshResult = await session.refresh();

        if (!refreshResult.authenticated) {
          return this.denyRequest(res, `WorkOS session refresh failed: ${refreshResult.reason}`);
        }

        const { sealedSession } = refreshResult;
        if (!sealedSession) {
          return this.denyRequest(res, 'WorkOS refresh returned no sealed session');
        }

        // Update the cookie with the refreshed session
        res.cookie('wos-session', sealedSession, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
        });

        // Re-load the refreshed session to get the user
        const refreshedSession = WorkOsService.loadSealedSession(sealedSession);
        const refreshedAuth = await refreshedSession.authenticate();

        if (refreshedAuth.authenticated) {
          req.workosUser = refreshedAuth.user;
          req.jwtData = refreshedAuth.user;
          req.originalToken = sealedSession;
          return next();
        }

        return this.denyRequest(res, 'WorkOS session invalid after refresh');
      } catch (refreshError) {
        res.clearCookie('wos-session');
        return this.denyRequest(res, String(refreshError), 'Session expired. Please sign in again.');
      }
    } catch (error) {
      return this.denyRequest(res, String(error), 'Authentication failed.');
    }
  }
}

export default new AccessTokenService();
