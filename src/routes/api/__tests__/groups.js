import request from 'supertest';
import app from '../../../app';
import User from '../../../models/User';
import Group from '../../../models/Group';
import { resetDB } from '../../../utils/db';

describe('groups', () => {
    afterAll(async () => {
        await resetDB();
    });

    describe('[GET /api/groups]', () => {
        test('получения списка своих групп', async () => {
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

    describe('[POST /api/groups]', () => {
        test('создание группы', async () => {
            // Нужный пользователь и нужная группа
            const author = await new User({ email: 'user1@email.com', groups: [] }).save();
            const groupTitle = 'My Group1';

            const response = await request(app)
                .post('/api/groups')
                .send({ title: groupTitle })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(201);

            expect(response.body.group.title).toBe(groupTitle);
            expect(response.body.group.myRole).toBe(0);
        });
    });

    describe('[PATCH /api/groups/:id]', () => {
        test('обновление группы группы', async () => {
            // Нужный пользователь и нужная группа
            const group = await new Group({ title: 'group1' }).save();
            const author = await new User({ email: 'user2@email.com', groups: [{ group, role: 0 }] }).save();

            const response = await request(app)
                .patch(`/api/groups/${group._id}`)
                .send({ title: 'new title' })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('нелья обновить чужую группу', async () => {
            // Нужный пользователь и нужная группа
            const group = await new Group({ title: 'group1' }).save();
            const author = await new User({ email: 'user3@email.com', groups: [] }).save();

            const response = await request(app)
                .patch(`/api/groups/${group._id}`)
                .send({ title: 'new title' })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('[DELETE /api/groups/:id]', () => {
        test('удалить группу', async () => {
            // Нужный пользователь и нужная группа
            const group = await new Group({ title: 'group1' }).save();
            const author = await new User({ email: 'user4@email.com', groups: [{ group, role: 0 }] }).save();

            const response = await request(app)
                .delete(`/api/groups/${group._id}`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);

            // Группа должна удалиться
            expect(await Group.findById(group._id)).toBe(null);
        });

        test('нельзя удалить чужую группу', async () => {
            // Нужный пользователь и нужная группа
            const group = await new Group({ title: 'group1' }).save();
            const author = await new User({ email: 'user5@email.com', groups: [] }).save();

            const response = await request(app)
                .delete(`/api/groups/${group._id}`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('[GET /groups/:id/invite]', () => {
        beforeEach(async () => {
            await resetDB();
        });

        test('получить инвайт ссылку для группы', async () => {
            // Нужный пользователь и нужная группа
            const group = await new Group({ title: 'group' }).save();
            const author = await new User({ email: 'user@email.com', groups: [{ group, role: 0 }] }).save();

            const response = await request(app)
                .get(`/api/groups/${group._id}/invite`)
                .send({ role: 1 })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);
            expect(response.statusCode).toBe(200);
            expect(response.body.role).toBe(1);
        });

        test('нельзя получить инвайт ссылку чужой группы', async () => {
            const group = await new Group({ title: 'group1' }).save();
            const anotherGroup = await new Group({ title: 'group2' }).save();
            const author = await new User({ email: 'user@email.com', groups: [{ group, role: 0 }] }).save();

            const response = await request(app)
                .get(`/api/groups/${anotherGroup._id}/invite`)
                .send({ role: 1 })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(403);
        });

        test('нельзя получить инвайт ссылку с ролью админа', async () => {
            const group = await new Group({ title: 'group1' }).save();
            const author = await new User({ email: 'user@email.com', groups: [{ group, role: 0 }] }).save();

            const response = await request(app)
                .get(`/api/groups/${group._id}/invite`)
                .send({ role: 0 })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(422);
        });
    });

    describe('[POST /groups/:id/join]', () => {
        let group;
        let author;
        let anotherUser;
        let anotherGroup;

        beforeAll(async () => {
            await resetDB();

            // Нужный пользователь и нужная группа
            group = await new Group({ title: 'group' }).save();
            author = await new User({ email: 'user@email.com', groups: [{ group, role: 0 }] }).save();

            anotherGroup = await new Group({ title: 'group' }).save();
            anotherUser = await new User({ email: 'user2@email.com', groups: [] }).save();
        });

        test('входим в группу по инвайт ссылке', async () => {
            const responseInvite = await request(app)
                .get(`/api/groups/${group._id}/invite`)
                .send({ role: 1 })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            const { code, groupId } = responseInvite.body;

            const responseJoin = await request(app)
                .post(`/api/groups/${groupId}/join`)
                .send({ code })
                .set('Authorization', `JWT ${anotherUser.generateJWT()}`);

            expect(responseJoin.statusCode).toBe(200);

            anotherUser = await User.findById(anotherUser._id);
            expect(anotherUser.groups[0].group._id.toString()).toBe(group._id.toString());
            expect(anotherUser.groups[0].role).toBe(1);
        });

        test('пытаемся войти по инвайт ссылке в группу, в которой уже есть', async () => {
            const responseInvite = await request(app)
                .get(`/api/groups/${group._id}/invite`)
                .send({ role: 1 })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            const { code, groupId } = responseInvite.body;

            const responseJoin = await request(app)
                .post(`/api/groups/${groupId}/join`)
                .send({ code })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(responseJoin.statusCode).toBe(409);
        });

        test('пытаемся войти по инвайт ссылке в левую группу', async () => {
            const responseInvite = await request(app)
                .get(`/api/groups/${group._id}/invite`)
                .send({ role: 1 })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            const { code } = responseInvite.body;

            const responseJoin = await request(app)
                .post(`/api/groups/${anotherGroup._id}/join`)
                .send({ code })
                .set('Authorization', `JWT ${anotherUser.generateJWT()}`);

            expect(responseJoin.statusCode).toBe(403);
        });
    });
});
