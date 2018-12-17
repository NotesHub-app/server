import request from 'supertest';
import app from '../../../app';
import User from '../../../models/User';
import { resetDB } from '../../../utils/db';

describe('users', () => {
    afterEach(async () => {
        await resetDB();
    });

    describe('[PATCH /users/me]', () => {
        test('обновление пароля', async () => {
            let user = await new User({ email: 'user@email.com', password: 'qwerty123' }).save();
            user = await User.findById(user._id);

            const response = await request(app)
                .patch('/api/users/me')
                .send({
                    password: 'foobar321',
                })
                .set('Authorization', `JWT ${user.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            const userAfterUpdate = await User.findById(user._id);

            expect(userAfterUpdate.password).not.toBe(user.password);
        });

        test('обновление uiSettings', async () => {
            const user = await new User({
                email: 'user@email.com',
                password: 'qwerty123',
                uiSettings: {
                    initParam: 'initValue',
                    param1: 'value',
                },
            }).save();

            const response = await request(app)
                .patch('/api/users/me')
                .send({
                    uiSettings: { param1: 'newValue', param2: 'newValue' },
                })
                .set('Authorization', `JWT ${user.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            const userAfterUpdate = await User.findById(user._id);

            expect(userAfterUpdate.uiSettings.initParam).toBe('initValue');
            expect(userAfterUpdate.uiSettings.param1).toBe('newValue');
            expect(userAfterUpdate.uiSettings.param2).toBe('newValue');
        });
    });
});
