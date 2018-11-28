// Middleware для авторизации
import passport from 'passport/lib';

export const requireAuth = passport.authenticate('jwt', { session: false });
export const requireLogin = passport.authenticate('local', { session: false });
