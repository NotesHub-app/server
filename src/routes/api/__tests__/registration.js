import app from '../../../app';
import request from 'supertest';
import User from '../../../models/User';
import { resetDB } from '../../../utils/db';

const newUser = { email: 'new@email.com', password: 'megapassword' };
let verificationCode = '';

describe('registration', () => {
    afterAll(async () => {
        await resetDB();
    });

    test('[POST /api/registration] неверные параметры регистрации', async () => {
        const response = await request(app)
            .post('/api/registration')
            .send({ param: 'wrong' });

        expect(response.statusCode).toBe(422);
    });

    test('[POST /api/registration] успешная регистрация', async () => {
        const response = await request(app)
            .post('/api/registration')
            .send(newUser);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        //Проверяем что создался пользователь в базе
        const user = await User.findOne({ email: newUser.email });

        //пароль должен быть захеширован
        expect(user.password).not.toBe(newUser.password);

        //Регистрация не должна быть подтвержденной
        expect(user.registration.verified).toBe(false);

        //Должен быть сгенерирован код верификации
        expect(user.registration.code.length).toBeGreaterThan(3);

        verificationCode = user.registration.code;
    });

    test('[POST /registration/confirm] используем неверный код подтверждения', async () => {
        const response = await request(app)
            .post('/api/registration/confirm')
            .send({
                email: newUser.email,
                code: 'WRONG_CODE',
            });

        expect(response.statusCode).toBe(404);
    });

    test('[POST /registration/confirm] успешное подтверждение регистрации', async () => {
        const response = await request(app)
            .post('/api/registration/confirm')
            .send({
                email: newUser.email,
                code: verificationCode,
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        //Проверяем что пользователь в базе поменялся
        const user = await User.findOne({ email: newUser.email });

        //Регистрация должна быть подтвержденной
        expect(user.registration.verified).toBe(true);
    });
});
