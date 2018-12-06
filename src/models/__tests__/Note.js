import { resetDB } from '../../utils/db';
import Note from '../Note';
import User from '../User';
import { generateNote } from '../../utils/fake';

describe('NoteModel', () => {
    afterEach(async () => {
        await resetDB();
    });

    test('generateHistory method', async () => {
        // Создаем пользователя который будет делать правки
        const author = await new User({ email: 'user@mail.com' }).save();

        // Создаем заметку
        const note = await new Note({ ...generateNote(), content: 'fooContent', owner: author }).save();

        // Правим заметку
        note.content = 'foo';
        note.generateHistory(author);

        // В истории должна быть одна запись
        expect(note.history).toHaveLength(1);

        // У правки в истории должен быть автор и время
        expect(note.history[0].author._id.toString()).toBe(author._id.toString());
        expect(note.history[0].dateTime).not.toBeUndefined();

        // Должно быть зафиксировано только одно изменение
        expect(note.history[0].changes).toHaveLength(1);
        expect(note.history[0].changes[0].field).toBe('content');
        expect(note.history[0].changes[0].diff).not.toBeUndefined();
    });

    test('getChildrenIdsOf method', async () => {
        // Создаем пользователя который будет делать правки
        const author = await new User({ email: 'user@mail.com' }).save();

        // Создаем связанные заметки
        const note1 = await new Note({ ...generateNote(), title: 'note1', owner: author }).save();
        const note2 = await new Note({ ...generateNote(), title: 'note2', owner: author, parent: note1 }).save();
        const note3 = await new Note({ ...generateNote(), owner: author, title: 'note3', parent: note2 }).save();
        await new Note({ ...generateNote(), owner: author, title: 'note4', parent: note3 }).save();

        // Создаем отдельно стоящую заметку
        await new Note({ ...generateNote(), title: 'note4_SEP', owner: author }).save();

        const childrenIds = await Note.getChildrenIdsOf(note1);

        // Должно остаться только одна заметка
        expect(childrenIds).toHaveLength(3);
    });
});
