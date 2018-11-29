import { resetDB } from '../../utils/db';
import Note from '../Note';
import User from '../User';
import { generateNote } from '../../utils/fake';

describe('NoteModel', () => {
    afterAll(async () => {
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
});
