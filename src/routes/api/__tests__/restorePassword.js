import request from 'supertest';
import app from '../../../app';
import User from '../../../models/User';
import { resetDB } from '../../../utils/db';

describe('restorePassword', () => {
    afterAll(async () => {
        await resetDB();
    });

    let user;
    beforeAll(async () => {
        user = await new User({ email: 'user@mail.com' }).save();
    });

    describe('[POST /api/restorePassword]', async () => {
        test('генерация кода восстановления', async () => {
            const response = await request(app)
                .post('/api/restorePassword')
                .send({ email: user.email });
            expect(response.statusCode).toBe(200);

            user = await User.findById(user._id);

            expect(user.restorePasswordCodes).toHaveLength(1);
        });

        test('генерация кода для несуществующего email', async () => {
            const response = await request(app)
                .post('/api/restorePassword')
                .send({ email: 'invalid@email.com' });

            // Всё равно должны получать такой-же ответ как при нормальном запросе
            expect(response.statusCode).toBe(200);
        });
    });

    describe('[POST /api/restorePassword/confirm]', () => {
        test('сбиваем пароль по коду восстановления', async () => {
            user = await User.findById(user._id);
            const previousPassword = user.password;

            const response = await request(app)
                .post('/api/restorePassword/confirm')
                .send({ code: user.restorePasswordCodes[0].code, password: 'newPassword' });

            expect(response.statusCode).toBe(200);

            user = await User.findById(user._id);

            expect(user.password).not.toBe(previousPassword);
        });
    });
});
