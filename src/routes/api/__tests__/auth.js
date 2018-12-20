import request from 'supertest';
import timekeeper from 'timekeeper';
import dayjs from 'dayjs';
import User from '../../../models/User';
import app from '../../../app';
import { resetDB } from '../../../test/helpers';

const ROUTES = {
    login: '/api/auth/login',
};

const validUser = {
    email: 'valid@email.com',
    userName: 'Valid User',
    password: 'good_password',
    registration: {
        verified: true,
    },
};

let token = '';
let refreshToken = '';
let newRefreshToken = '';

describe('auth', () => {
    afterAll(async () => {
        await resetDB();
    });

    afterEach(() => {
        timekeeper.reset();
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
            expect(response.body.userName).toBe(validUser.userName);
            expect(response.body.token.length).toBeGreaterThan(20);

            token = response.body.token;
            refreshToken = response.body.refreshToken;
        });
    });

    describe('[POST /api/auth/refresh-token]', () => {
        test('попытка обновления токена с auth-токеном', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .set('Authorization', token)
                .send({});

            expect(response.statusCode).toBe(401);
        });

        test('успешное обновление токена с refresh-токеном', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .set('Authorization', refreshToken)
                .send({});

            expect(response.statusCode).toBe(200);

            newRefreshToken = response.body.refreshToken;
        });

        test('повторное использование refresh-токена даст ошибку', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .set('Authorization', refreshToken)
                .send({});

            expect(response.statusCode).toBe(401);
        });

        test('попытка заслать неверный токен', async () => {
            const response = await request(app)
                .post('/api/auth/refresh-token')
                .set('Authorization', 'WRONG_TOKEN!')
                .send({});

            expect(response.statusCode).toBe(401);
        });

        test('попытка заслать просроченный refresh-токен', async () => {
            timekeeper.travel(new Date(dayjs().add(400, 'days')));

            const response = await request(app)
                .post('/api/auth/refresh-token')
                .set('Authorization', newRefreshToken)
                .send({});

            expect(response.statusCode).toBe(401);
        });

        test('попытка заслать просроченный auth-токен', async () => {
            timekeeper.travel(new Date(dayjs().add(20, 'days')));

            const response = await request(app)
                .get('/api/notes')
                .set('Authorization', token)
                .send({});

            expect(response.statusCode).toBe(401);
        });
    });
});
