import mailgun from 'mailgun-js';
import { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM } from '../config';

export default class MailService {
    constructor() {
        this.mg = mailgun({ apiKey: MAILGUN_API_KEY || '?', domain: MAILGUN_DOMAIN || '?' });
    }

    async sendMail({ to, subject, text }) {
        try {
            await this.mg.messages().send({
                from: MAILGUN_FROM,
                to,
                subject,
                text,
            });
        } catch (e) {
            console.error(e);
        }
    }
}
