import { resetDB } from '../../utils/db';
import Group from '../Group';
import User from '../User';

describe('GroupModel', () => {
    afterAll(async () => {
        await resetDB();
    });

    test('toIndexJSON method', async () => {
        const group = await new Group({ title: 'fooGroup' }).save();
        const user = await new User({ email: 'author@email.com', groups: [{ group, role: 0 }] }).save();

        const result = group.toIndexJSON(user);

        expect(result.id).toBe(group._id);
        expect(result.title).toBe(group.title);
        expect(result.myRole).toBe(user.groups[0].role);
    });
});
