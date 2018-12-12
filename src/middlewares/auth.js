// Middleware для авторизации
import passport from 'passport/lib';

export const requireAuth = passport.authenticate('jwt-auth', { session: false });
export const requireRefreshAuth = passport.authenticate('jwt-refresh', { session: false });
export const requireFileAuth = passport.authenticate('jwt-file', { session: false });
export const requireLogin = passport.authenticate('local', { session: false });
