import request from 'supertest';
import app from '../../../app';
import User from '../../../models/User';
import Group from '../../../models/Group';
import { resetDB } from '../../../utils/db';

describe('notes', () => {
    afterAll(async () => {
        await resetDB();
    });

    test('[GET /api/groups] получения списка своих групп', async () => {
        // Нужный пользователь и нужная группа
        const group = await new Group({ title: 'group' }).save();
        const user = await new User({ email: 'user@email.com', groups: [{ group, role: 0 }] }).save();

        // Другая группа и другой пользователь
        const anotherGroup = await new Group({
            title: 'anotherGroup',
        }).save();
        await new User({ email: 'another-user@email.com', groups: [{ group: anotherGroup, role: 0 }] }).save();


        const response = await request(app)
            .get('/api/groups')
            .set('Authorization', `JWT ${user.generateJWT()}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.groups.length).toBe(1);
        expect(response.body.groups[0].title).toBe(group.title);
        expect(response.body.groups[0].myRole).toBe(0);
    });
});
