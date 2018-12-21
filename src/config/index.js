import dotenv from 'dotenv';

dotenv.config();

export const secret = process.env.NODE_ENV === 'production' ? process.env.SECRET : 'secret';

export const serverConfiguration = {
    googleAuth: true,
    githubAuth: true,
    useRecaptcha: true,
    emailRegistrationConfirmation: true,
};
