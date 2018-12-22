import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GitHubStrategy } from 'passport-github';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';
import { secret } from './index';

// Настройка проверки аутентификации по паролю
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
        },
    ),
);

//
// Стратегия jwt-auth
//

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
    },
);
jwtAuthStrategy.name = 'jwt-auth';
passport.use(jwtAuthStrategy);

//
// Стратегия jwt-refresh
//

const jwtRefreshStrategy = new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
        secretOrKey: secret,
    },
    async (payload, done) => {
        if (payload.type !== 'refresh') {
            return done(null, false);
        }

        try {
            const user = await User.findOne({ _id: payload.id, refreshTokenCode: payload.code });

            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (err) {
            return done(err, false);
        }
    },
);
jwtRefreshStrategy.name = 'jwt-refresh';
passport.use(jwtRefreshStrategy);

//
// Стратегия jwt-file
//

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
    },
);
jwtFileStrategy.name = 'jwt-file';
passport.use(jwtFileStrategy);

//
// Стратегия github
//

const githubStrategy = new GitHubStrategy(
    {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/callback/github',
        failureRedirect: 'http://localhost:3000/login?status=failed',
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ githubId: profile.id });
            if (!user) {
                user = new User({
                    githubId: profile.id,
                    userName: profile.displayName,
                    githubInfo: profile._json,
                    registration: {
                        verified: true,
                    },
                });
                await user.save();
            }

            done(null, user);
        } catch (err) {
            return done(err, false);
        }
    },
);
githubStrategy.name = 'github';
passport.use(githubStrategy);

//
// Стратегия google
//

const googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/callback/google',
        scope: ['profile'],
        failureRedirect: 'http://localhost:3000/login?status=failed',
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                user = new User({
                    googleId: profile.id,
                    userName: profile.displayName,
                    googleInfo: profile._json,
                    registration: {
                        verified: true,
                    },
                });
                await user.save();
            }

            done(null, user);
        } catch (err) {
            return done(err, false);
        }
    },
);
googleStrategy.name = 'google';
passport.use(googleStrategy);
