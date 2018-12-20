import mailgun from 'mailgun-js';

export default class MailService {
    constructor() {
        this.mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });
    }

    async sendMail({ to, subject, text }) {
        try {
            await this.mg.messages().send({
                from: process.env.MAILGUN_FROM,
                to,
                subject,
                text,
            });
        } catch (e) {
            console.error(e);
        }
    }
}
