import dotenv from 'dotenv';

dotenv.config();

export const SECRET = process.env.NODE_ENV === 'production' ? process.env.SECRET : 'secret';
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '?';
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '?';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '?';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '?';
export const GOOGLE_RECAPTCHA_SECRET_KEY = process.env.GOOGLE_RECAPTCHA_SECRET_KEY || '?';
export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '?';
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '?';
export const MAILGUN_FROM = process.env.MAILGUN_FROM || '?';

export const serverConfiguration = {
    googleAuth: JSON.stringify(process.env.GOOGLE_AUTH || false),
    githubAuth: JSON.stringify(process.env.GITHUB_AUTH || false),
    emailRegistrationConfirmation: JSON.stringify(process.env.EMAIL_REGISTRATION_CONFIRMATION || false),
    useRecaptcha: JSON.stringify(process.env.USE_RECAPTCHA || false),
    recaptchaClientKey: process.env.GOOGLE_RECAPTCHA_SITE_KEY,
};
