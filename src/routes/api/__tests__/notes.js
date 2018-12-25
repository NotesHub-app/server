import request from 'supertest';
import DiffMatchPatch from 'diff-match-patch';
import app from '../../../app';
import Note from '../../../models/Note';
import User from '../../../models/User';
import Group from '../../../models/Group';
import { resetDB } from '../../../test/helpers';
import { generateNote } from '../../../utils/fake';

let author;
let anotherAuthor;
let group;

describe('notes', () => {
    beforeAll(async () => {
        group = await new Group({ title: 'fooGroup' }).save();
        author = await new User({ email: 'author@email.com', groups: [{ group, role: 0 }] }).save();
        anotherAuthor = await new User({ email: 'anotherAuthor@email.com', groups: [] }).save();
    });

    afterAll(async () => {
        await resetDB();
    });

    describe('[GET /api/notes]', () => {
        test('получения списка заметок', async () => {
            // Создаем левую группу и пользователя
            const anotherGroup = await new Group({ title: 'fooGroup' }).save();
            const anotherUser = await new User({
                email: 'another@email.com',
                groups: [{ group: anotherGroup, role: 0 }],
            }).save();

            // Создаем заметку принадлежащих пользователю
            await new Note({ ...generateNote(), owner: author.id }).save();

            // Создаем заметку НЕ принадлежащую пользователю
            await new Note({ ...generateNote(), owner: anotherUser._id }).save();

            // Создаем заметку принадлежащую группе в котороый состоит пользователь
            await new Note({ ...generateNote(), group: group._id }).save();

            // Создаем заметку НЕ принадлежащую группе в котороый состоит пользователь
            await new Note({ ...generateNote(), group: anotherGroup._id }).save();

            const response = await request(app)
                .get('/api/notes')
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            // 1 заметка пользователя + 1 заметка группы в котороый состоит пользователь
            expect(response.body.notes.length).toBe(2);
        });
    });

    describe('[GET /api/notes/:note]', () => {
        test('получения заметки по неверному ID', async () => {
            const response = await request(app)
                .get('/api/notes/WRONG_ID')
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(404);
        });

        test('получения заметки', async () => {
            const note = await new Note({ ...generateNote(), owner: author.id }).save();

            const response = await request(app)
                .get(`/api/notes/${note._id}`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            expect(response.body.note.title).toBe(note.title);
            expect(response.body.note.content).toBe(note.content);
        });
    });

    describe('[GET /api/notes/:note/history + /:idx]', async () => {
        test('получение истории', async () => {
            const note = new Note({ ...generateNote(), owner: author.id });
            note.generateHistory(author);
            await note.save();

            let response = await request(app)
                .get(`/api/notes/${note._id}/history`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            expect(response.body.history).toHaveLength(1);
            expect(response.body.history[0].author.email).toBe(author.email);
            expect(typeof response.body.history[0].dateTime).toBe('number');

            // Получение деталий истории

            response = await request(app)
                .get(`/api/notes/${note._id}/history/0`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            expect(response.body.before).not.toBeUndefined();
            expect(response.body.after).not.toBeUndefined();
        });
    });

    describe('[POST /api/notes]', () => {
        test('создание заметки с невалидными параметрами', async () => {
            const response = await request(app)
                .post(`/api/notes`)
                .send({ random: 'data' })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(422);
        });

        test('[POST /api/notes] создание заметки', async () => {
            const newNote = {
                ...generateNote(),
            };
            const response = await request(app)
                .post(`/api/notes`)
                .send(newNote)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(201);

            expect(response.body.note.title).toBe(newNote.title);
            expect(response.body.note.content).toBe(newNote.content);
        });

        test('[POST /api/notes] создание заметки с указаниаем родителя', async () => {
            const parentNote = await new Note({ ...generateNote(), owner: author._id }).save();
            const newNote = {
                ...generateNote(),
                parentId: parentNote._id.toString(),
            };
            const response = await request(app)
                .post(`/api/notes`)
                .send(newNote)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(201);

            expect(response.body.note.title).toBe(newNote.title);
            expect(response.body.note.content).toBe(newNote.content);
            expect(response.body.note.parentId).toBe(newNote.parentId);
        });

        test('[POST /api/notes] создание групповой заметки с указаниаем родителя без указания группы', async () => {
            const parentNote = await new Note({ ...generateNote(), group }).save();
            const newNote = {
                ...generateNote(),
                parentId: parentNote._id.toString(),
            };
            const response = await request(app)
                .post(`/api/notes`)
                .send(newNote)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(201);

            expect(response.body.note.title).toBe(newNote.title);
            expect(response.body.note.content).toBe(newNote.content);
            expect(response.body.note.parentId).toBe(newNote.parentId);
            // Группа всё равно должна быть, даже если мы её не указали (берется от родителя)
            expect(response.body.note.groupId).toBe(group._id.toString());
        });
    });

    describe('[PATCH /api/notes]', () => {
        test('обновление заметки', async () => {
            let note = await new Note({ ...generateNote('xxx'), content: 'OLD_CONTENT', owner: author._id }).save();

            const dmp = new DiffMatchPatch();
            const contentPatch = dmp.patch_make(note.content, 'NEW_CONTENT');

            const response = await request(app)
                .patch(`/api/notes/${note._id}`)
                .send({ title: 'NEW_TITLE', content: contentPatch })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            note = await Note.findById(note._id);

            expect(note.title).toBe('NEW_TITLE');
            expect(note.content).toBe('NEW_CONTENT');
        });
    });

    describe('[DELETE /api/notes/:note]', () => {
        test('удаление заметки', async () => {
            const note = await new Note({ ...generateNote(), title: 'note_to_remove', owner: author._id }).save();
            const subNote = await new Note({
                ...generateNote(),
                title: 'sub_note',
                owner: author._id,
                parent: note,
            }).save();

            const anotherNote = await new Note({ ...generateNote(), title: 'another_note', owner: author._id }).save();

            const response = await request(app)
                .delete(`/api/notes/${note._id}`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            expect(await Note.findById(note.id)).toBe(null);
            expect(await Note.findById(subNote.id)).toBe(null);
            expect(await Note.findById(anotherNote.id)).not.toBe(null);
        });

        test('нельзя удалить чужую', async () => {
            const note = await new Note({
                ...generateNote(),
                title: 'note_to_remove',
                owner: anotherAuthor._id,
            }).save();

            const response = await request(app)
                .delete(`/api/notes/${note._id}`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(404);
        });
    });
});
