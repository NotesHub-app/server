import User from '../models/User';
import Note from '../models/Note';
import Group from '../models/Group';
import { generateNote } from '../utils/fake';

export default async function seed(mongooseConnectionPromise) {
    // Удостоверяемся, что подключены к БД
    await mongooseConnectionPromise;

    // Если нет пользователей
    if (!await User.countDocuments()) {
        // Создаем группу
        const group = await new Group({
            title: 'My group',
        });

        // Создаем пользователя
        const user = await new User({
            email: 'admin@email.com',
            password: 'password',
            registration: { verified: true },
            groups: [group],
        }).save();

        // Персональную заметку
        await new Note({
            ...generateNote(),
            title: 'Personal note1',
            owner: user,
        });

        // Заметку группы
        await new Note({
            ...generateNote(),
            title: 'Group note1',
            group,
        });

        console.info('DB seeded');
    } else {
        console.info('No need to seed DB');
    }
}
