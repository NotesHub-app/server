import request from 'supertest';
import User from '../../../models/User';
import app from '../../../app';
import { resetDB } from '../../../utils/db';

const ROUTES = {
    login: '/api/auth/login',
};

const validUser = {
    email: 'valid@email.com',
    password: 'good_password',
    registration: {
        verified: true,
    },
};

let validToken = '';

describe('auth', () => {
    afterAll(async () => {
        await resetDB();
    });

    describe('[POST /api/auth/login]', () => {
        test(' без параметров', async () => {
            const response = await request(app).post(ROUTES.login);
            expect(response.statusCode).toBe(400);
        });

        test(' неверная учетка', async () => {
            const response = await request(app)
                .post(ROUTES.login)
                .send({ email: 'wrong@email.com', password: 'wrong_password' });

            expect(response.statusCode).toBe(401);
        });

        test(' успешная авторизация', async () => {
            await new User(validUser).save();

            const response = await request(app)
                .post(ROUTES.login)
                .send({ email: validUser.email, password: validUser.password });

            expect(response.statusCode).toBe(200);
            expect(response.body.email).toBe(validUser.email);
            expect(response.body.token.length).toBeGreaterThan(20);

            validToken = response.body.token;
        });
    });

    describe('[GET /api/auth/keep-token]', () => {
        test('обновление токена', async () => {
            const response = await request(app)
                .get('/api/auth/keep-token')
                .set('Authorization', validToken)
                .send({});

            expect(response.statusCode).toBe(200);
            expect(response.body.email).toBe(validUser.email);
            expect(response.body.token.length).toBeGreaterThan(20);
        });

        test('попытка заслать неверный токен', async () => {
            const response = await request(app)
                .get('/api/auth/keep-token')
                .set('Authorization', 'WRONG_TOKEN!')
                .send({});

            expect(response.statusCode).toBe(401);
        });
    });
});
