import express from 'express';
import WorkOsService from '@/services/WorkOsService';

const router = express.Router();

/**
 * GET /auth/login
 *
 * Redirects the user to the WorkOS AuthKit hosted sign-in page.
 * Register this path as the "Sign-in endpoint" in the WorkOS Dashboard.
 */
router.get('/login', (_req, res) => {
  res.redirect(WorkOsService.getAuthorizationUrl());
});

/**
 * GET /auth/callback
 *
 * WorkOS redirects here after the user authenticates.
 * Exchanges the authorization code for a sealed session and stores it
 * in an httpOnly cookie.
 *
 * Register this path as a "Redirect URI" in the WorkOS Dashboard
 * (e.g. http://localhost:8080/auth/callback).
 */
router.get('/callback', async (req, res) => {
  const code = req.query.code as string | undefined;

  if (!code) {
    return res.status(400).json({ message: 'No authorization code provided' });
  }

  try {
    const sealedSession = await WorkOsService.authenticateWithCode(code);

    // Store the sealed session in a secure httpOnly cookie
    res.cookie('wos-session', sealedSession, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });

    // Redirect to the app root — change this to suit your frontend
    return res.redirect('/');
  } catch (error) {
    console.error('WorkOS callback error:', error);
    return res.redirect('/auth/login');
  }
});

/**
 * POST /auth/logout
 *
 * Ends the WorkOS session and clears the session cookie.
 * The user is redirected to the WorkOS sign-out URL which in turn
 * redirects to the "Sign-out redirect" configured in the WorkOS Dashboard.
 */
router.post('/logout', async (req, res) => {
  const sessionData = req.cookies?.['wos-session'];

  if (!sessionData) {
    return res.redirect('/');
  }

  try {
    const logoutUrl = await WorkOsService.getLogoutUrl(sessionData);

    res.clearCookie('wos-session');
    return res.redirect(logoutUrl);
  } catch (error) {
    console.error('WorkOS logout error:', error);
    res.clearCookie('wos-session');
    return res.redirect('/');
  }
});

export default router;
