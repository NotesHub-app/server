import * as _ from 'lodash';
import User from '../models/User';
import Note from '../models/Note';
import Group from '../models/Group';
import { generateNote } from '../utils/fake';
import { resetDB } from '../utils/db';

let nonceValue = 0;
const getNonce = () => {
    nonceValue += 1;
    return nonceValue;
};

async function makeNotes({ parent, group, owner, deepness = 0 }) {
    if (deepness < 3) {
        // eslint-disable-next-line no-unused-vars
        for (const idx of _.range(1, 5)) {
            const note = await new Note({
                ...generateNote(getNonce()),
                owner,
                group,
                parent,
            }).save();
            await makeNotes({ parent: note, owner, group, deepness: deepness + 1 });
        }
    }
}

export default async function seed() {
    // Если нет пользователей
    if (!(await User.countDocuments())) {
        console.log('F--1');
        await resetDB();
        console.log('F--2');

        // Создаем группу
        const group = await new Group({
            title: 'My group',
        }).save();

        // Создаем пользователя
        const user = await new User({
            email: 'admin@email.com',
            password: 'password',
            registration: { verified: true },
            groups: [{ group, role: 0 }],
        }).save();

        await makeNotes({ owner: user });
        await makeNotes({ group });

        console.info('DB seeded');
    } else {
        console.info('No need to seed DB');
    }
}
