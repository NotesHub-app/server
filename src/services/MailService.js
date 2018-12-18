import mailgun from 'mailgun-js';
import { mailgunConfig } from '../config';

export default class MailService {
    constructor() {
        this.mg = mailgun({ apiKey: mailgunConfig.key, domain: mailgunConfig.domain });
    }

    async sendMail({ to, subject, text }) {
        try {
            await this.mg.messages().send({
                from: mailgunConfig.from,
                to,
                subject,
                text,
            });
        } catch (e) {
            console.error(e);
        }
    }
}
