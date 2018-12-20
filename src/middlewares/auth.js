// Middleware для авторизации
import passport from 'passport/lib';

export const requireAuth = passport.authenticate('jwt-auth', { session: false });
export const requireRefreshAuth = passport.authenticate('jwt-refresh', { session: false });
export const requireFileAuth = passport.authenticate('jwt-file', { session: false });
export const requireLogin = passport.authenticate('local', { session: false });
export const requireGithubAuth = passport.authenticate('github', { session: false });
export const requireGoogleAuth = passport.authenticate('google', { session: false });
