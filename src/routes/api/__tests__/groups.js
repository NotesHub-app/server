import app from '../../../app';
import request from 'supertest';
import Note from '../../../models/Note';
import User from '../../../models/User';
import Group from '../../../models/Group';
import mongoose from 'mongoose';
import { resetDB } from '../../../utils/db';

describe('notes', () => {
    afterAll(async () => {
        await resetDB();
    });

    test('[GET /api/groups] получения списка своих групп', async () => {
        const user = await new User({ email: 'user@email.com', groups: [] }).save();
        const group = await new Group({ title: 'group', users: [{ user: user.id, role: 0 }] }).save();

        const anotherUser = await new User({ email: 'another-user@email.com', groups: [] }).save();
        const anotherGroup = await new Group({ title: 'anotherGroup', users: [{ user: anotherUser.id, role: 0 }] }).save();

        const response = await request(app)
            .get('/api/groups')
            .set('Authorization', `JWT ${user.generateJWT()}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.groups.length).toBe(1);
        expect(response.body.groups[0].title).toBe(group.title);
        expect(response.body.groups[0].myRole).toBe(1);
    });
});
