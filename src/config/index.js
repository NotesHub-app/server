import dotenv from 'dotenv';

dotenv.config();

export const secret = process.env.NODE_ENV === 'production' ? process.env.SECRET : 'secret';

export const serverConfiguration = {
    googleAuth: JSON.stringify(process.env.GOOGLE_AUTH || false),
    githubAuth: JSON.stringify(process.env.GITHUB_AUTH || false),
    emailRegistrationConfirmation: JSON.stringify(process.env.EMAIL_REGISTRATION_CONFIRMATION || false),
    useRecaptcha: JSON.stringify(process.env.USE_RECAPTCHA || false),
    recaptchaClientKey: process.env.GOOGLE_RECAPTCHA_SITE_KEY,
};
