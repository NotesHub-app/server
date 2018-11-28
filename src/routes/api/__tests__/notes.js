import app from '../../../app';
import request from 'supertest';
import Note from '../../../models/Note';
import User from '../../../models/User';
import Group from '../../../models/Group';
import { resetDB } from '../../../utils/db';

let author;
let group;

const generateNote = (suffix = '') => {
    return {
        title: `note${suffix}`,
        icon: `icon${suffix}`,
        iconColor: `#FFFFFF`,
        content: `content${suffix}`,
        history: [],
    };
};

describe('notes', () => {
    beforeAll(async () => {
        group = await new Group({ title: 'fooGroup', users: [] }).save();
        author = await new User({ email: 'author@email.com', groups: [group._id] }).save();
    });

    afterAll(async () => {
        await resetDB();
    });

    test('[GET /api/notes] получения списка заметок', async () => {
        //Создаем владельцев

        const anotherGroup = await new Group({ title: 'fooGroup', users: [] }).save();

        const anotherUser = await new User({ email: 'another@email.com', groups: [] }).save();

        //Создаем заметку принадлежащих пользователю
        await new Note({ ...generateNote(), owner: author.id }).save();

        //Создаем заметку НЕ принадлежащую пользователю
        await new Note({ ...generateNote(), owner: anotherUser._id }).save();

        //Создаем заметку принадлежащую группе в котороый состоит пользователь
        await new Note({ ...generateNote(), group: group._id }).save();

        //Создаем заметку НЕ принадлежащую группе в котороый состоит пользователь
        await new Note({ ...generateNote(), group: anotherGroup._id }).save();

        const response = await request(app)
            .get('/api/notes')
            .set('Authorization', `JWT ${author.generateJWT()}`);

        expect(response.statusCode).toBe(200);

        //1 заметка пользователя + 1 заметка группы в котороый состоит пользователь
        expect(response.body.notes.length).toBe(2);
    });

    test('[GET /api/notes/:id] получения заметки по неверному ID', async () => {
        const response = await request(app)
            .get('/api/notes/WRONG_ID')
            .set('Authorization', `JWT ${author.generateJWT()}`);

        expect(response.statusCode).toBe(404);
    });

    test('[GET /api/notes/:id] получения заметки', async () => {
        const note = await new Note({ ...generateNote(), owner: author.id }).save();

        const response = await request(app)
            .get(`/api/notes/${note._id}`)
            .set('Authorization', `JWT ${author.generateJWT()}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.note.title).toBe(note.title);
        expect(response.body.note.content).toBe(note.content);
    });

    test('[POST /api/notes] создание заметки с невалидными параметрами', async () => {
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

    test('[DELETE /api/notes/:id] удаление заметки', async () => {
        const note = await new Note({ ...generateNote(), title: 'note_to_remove', owner: author._id }).save();

        const response = await request(app)
            .delete(`/api/notes/${note._id}`)
            .set('Authorization', `JWT ${author.generateJWT()}`);

        expect(response.statusCode).toBe(200);
    });
});
