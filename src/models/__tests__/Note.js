import { resetDB } from '../../test/helpers';
import Note from '../Note';
import User from '../User';
import { generateNote } from '../../utils/fake';
import Group from '../Group';
import File from '../File';

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

    describe('getInvolvedUserIds method', async () => {
        test('getInvolvedUserIds для owner-а', async () => {
            const author = await new User({ email: 'user@mail.com' }).save();

            let note = await new Note({ ...generateNote(), title: 'note1', owner: author }).save();
            note = await Note.findById(note._id);

            expect(await note.getInvolvedUserIds()).toEqual([author._id.toString()]);
        });

        test('getInvolvedUserIds для group-ы', async () => {
            const group = await new Group({ title: 'group' }).save();
            const user1 = await new User({ email: 'user1@email.com', groups: [{ group, role: 0 }] }).save();
            const user2 = await new User({ email: 'user2@email.com', groups: [{ group, role: 0 }] }).save();

            let note = await new Note({ ...generateNote(), title: 'note1', group }).save();
            note = await Note.findById(note._id);

            expect(await note.getInvolvedUserIds()).toEqual([user1._id.toString(), user2._id.toString()]);
        });

        test('getInvolvedUserIds для заметки без владельца', async () => {
            let note = await new Note({ ...generateNote(), title: 'note1' }).save();
            note = await Note.findById(note._id);
            expect(await note.getInvolvedUserIds()).toEqual([]);
        });
    });

    describe('checkAllowToEdit method', async () => {
        test('checkAllowToEdit для owner-а', async () => {
            const author = await new User({ email: 'user@mail.com' }).save();
            const anotherUser = await new User({ email: 'user2@mail.com' }).save();

            let note = await new Note({ ...generateNote(), title: 'note1', owner: author }).save();
            note = await Note.findById(note._id);

            expect(await note.checkAllowToEdit(author)).toBe(true);
            expect(await note.checkAllowToEdit(anotherUser)).toBe(false);
        });

        test('checkAllowToEdit для group-а', async () => {
            const group = await new Group({ title: 'group' }).save();
            const user0admin = await new User({ email: 'user0admin@mail.com', groups: [{ group, role: 0 }] }).save();
            const user1moder = await new User({ email: 'user1moder@mail.com', groups: [{ group, role: 1 }] }).save();
            const user2reader = await new User({ email: 'user2reader@mail.com', groups: [{ group, role: 2 }] }).save();

            const anotherUser = await new User({ email: 'anotheruser@mail.com' }).save();

            let note = await new Note({ ...generateNote(), title: 'note1', group }).save();
            note = await Note.findById(note._id);

            expect(await note.checkAllowToEdit(user0admin)).toBe(true);
            expect(await note.checkAllowToEdit(user1moder)).toBe(true);
            expect(await note.checkAllowToEdit(user2reader)).toBe(false);
            expect(await note.checkAllowToEdit(anotherUser)).toBe(false);
        });
    });

    test('toIndexJSON method', async () => {
        const author = await new User({ email: 'user@mail.com' }).save();
        let note = await new Note({ ...generateNote(), title: 'note1', owner: author }).save();

        note = await Note.findById(note._id);

        expect(await note.toIndexJSON().title).toBe(note.title);
        expect(await note.toIndexJSON().content).toBeUndefined();
    });

    describe('pre(remove)', async () => {
        test('файлы заметки должны удалиться', async () => {
            const file = await new File({ fileName: 'foo.txt' }).save();
            let note = await new Note({ ...generateNote(), title: 'note1', files: [file] }).save();

            note = await Note.findById(note._id);

            await note.remove();

            expect(await File.findById(file._id)).toBe(null);
        });
    });
});
