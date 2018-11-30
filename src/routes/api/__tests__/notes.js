import request from 'supertest';
import app from '../../../app';
import Note from '../../../models/Note';
import User from '../../../models/User';
import Group from '../../../models/Group';
import { resetDB } from '../../../utils/db';
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
    });

    describe('[DELETE /api/notes/:note]', () => {
        test('удаление заметки', async () => {
            const note = await new Note({ ...generateNote(), title: 'note_to_remove', owner: author._id }).save();

            const response = await request(app)
                .delete(`/api/notes/${note._id}`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);
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
