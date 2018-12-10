import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User';
import { secret } from './index';

// Настройка проверки авторизации по паролю
passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            const user = await User.findOne({ email });

            // Пользователь с таким емейлом и паролем должен быть в базе
            if (!user || !(await user.comparePassword(password))) {
                return done(null, false, { errors: { 'email or password': 'is invalid' } });
            }

            // Регистрация должна быть верифицированной
            if (!user.registration.verified) {
                return done(null, false, { errors: { registration: 'registration is not verified' } });
            }

            return done(null, user);
        }
    )
);

// Стратегия jwt-auth
const jwtAuthStrategy = new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
        secretOrKey: secret,
    },
    async (payload, done) => {
        if (payload.type !== 'auth') {
            return done(null, false);
        }

        try {
            const user = await User.findById(payload.id);
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (err) {
            return done(err, false);
        }
    }
);
jwtAuthStrategy.name = 'jwt-auth';
passport.use(jwtAuthStrategy);

// Стратегия jwt-file
const jwtFileStrategy = new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
        secretOrKey: secret,
    },
    async (payload, done) => {
        if (payload.type !== 'file') {
            return done(null, false);
        }

        try {
            const user = await User.findById(payload.id);
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (err) {
            return done(err, false);
        }
    }
);
jwtFileStrategy.name = 'jwt-file';
passport.use(jwtFileStrategy);
