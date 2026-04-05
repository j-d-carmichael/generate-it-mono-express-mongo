import { WorkOS } from '@workos-inc/node';
import config from '../config';

const workos = new WorkOS(config.workos.apiKey, {
  clientId: config.workos.clientId,
});

class WorkOsService {
  /**
   * The WorkOS SDK instance.
   */
  public readonly workos = workos;

  /**
   * Returns the WorkOS AuthKit authorization URL for the hosted sign-in page.
   * Register the redirectUri as a "Redirect URI" in the WorkOS Dashboard.
   */
  public getAuthorizationUrl(): string {
    return workos.userManagement.getAuthorizationUrl({
      provider: 'authkit',
      redirectUri: config.workos.redirectUri,
      clientId: config.workos.clientId,
    });
  }

  /**
   * Exchanges an authorization code for a sealed session string.
   * @param code  The authorization code returned by WorkOS after authentication.
   */
  public async authenticateWithCode(code: string): Promise<string> {
    const { sealedSession } = await workos.userManagement.authenticateWithCode({
      clientId: config.workos.clientId,
      code,
      session: {
        sealSession: true,
        cookiePassword: config.workos.cookiePassword,
      },
    });

    return sealedSession;
  }

  /**
   * Loads a sealed session and returns the logout URL.
   * @param sessionData  The sealed session string from the `wos-session` cookie.
   */
  public async getLogoutUrl(sessionData: string): Promise<string> {
    const session = workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword: config.workos.cookiePassword,
    });

    return session.getLogoutUrl();
  }

  /**
   * Loads a sealed session and returns the authentication result.
   * @param sessionData  The sealed session string from the `wos-session` cookie.
   */
  public loadSealedSession(sessionData: string) {
    return workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword: config.workos.cookiePassword,
    });
  }
}

export default new WorkOsService();
