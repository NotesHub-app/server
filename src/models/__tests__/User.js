import { resetDB } from '../../test/helpers';
import Group from '../Group';
import User from '../User';

describe('GroupModel', () => {
    afterAll(async () => {
        await resetDB();
    });

    test('comparePassword method', async () => {
        const user = await new User({ email: 'user1@email.com', password: 'PASS' }).save();

        expect(await user.comparePassword('WRONG_PASS')).toBe(false);
        expect(await user.comparePassword('PASS')).toBe(true);
    });

    test('groupIds getter', async () => {
        const group = await new Group({ title: 'fooGroup' }).save();
        const user = await new User({ email: 'user2@email.com', groups: [{ group, role: 0 }] }).save();

        const result = user.groupIds;

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0].toString()).toBe(group._id.toString());
    });
});
