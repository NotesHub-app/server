import User from '../models/User';
import Note from '../models/Note';
import Group from '../models/Group';
import { generateNote } from '../utils/fake';
import { resetDB } from '../utils/db';

export default async function seed() {
    // Если нет пользователей
    if (!await User.countDocuments()) {

        await resetDB();

        // Создаем группу
        const group = await new Group({
            title: 'My group',
        }).save();

        // Создаем пользователя
        const user = await new User({
            email: 'admin@email.com',
            password: 'password',
            registration: { verified: true },
            groups: [{group, role: 0}],
        }).save();

        // Персональную заметку
        await new Note({
            ...generateNote(),
            title: 'Personal note1',
            owner: user,
        }).save();

        // Заметку группы
        await new Note({
            ...generateNote(),
            title: 'Group note1',
            group,
        }).save();

        console.info('DB seeded');
    } else {
        console.info('No need to seed DB');
    }
}
