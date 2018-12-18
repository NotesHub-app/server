import dotenv from 'dotenv';

dotenv.config();

export const secret = process.env.NODE_ENV === 'production' ? process.env.SECRET : 'secret';

export const mailgunConfig = {
    domain: process.env.MAILGUN_DOMAIN,
    key: process.env.MAILGUN_API_KEY,
    from: process.env.MAILGUN_FROM,
};
