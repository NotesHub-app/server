import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../../app';
import Note from '../../../models/Note';
import User from '../../../models/User';
import File from '../../../models/File';
import Group from '../../../models/Group';
import { resetDB } from '../../../utils/db';
import { generateNote } from '../../../utils/fake';

let author;
let note;
let anotherAuthor;
let group;
let file;

describe('files', () => {
    beforeAll(async () => {
        group = await new Group({ title: 'fooGroup' }).save();
        author = await new User({ email: 'author@email.com', groups: [{ group, role: 0 }] }).save();
        anotherAuthor = await new User({ email: 'anotherAuthor@email.com', groups: [] }).save();
        file = await new File({
            fileName: 'file.jpg',
            description: 'my file',
        }).save();
        note = await new Note({ ...generateNote(), owner: author, files: [file] }).save();
    });

    afterAll(async () => {
        await resetDB();
    });

    describe('[POST /api/files]', () => {
        test('создание записи файла', async () => {
            const fileData = { fileName: 'file.jpg', description: 'my file', noteId: note._id };
            const response = await request(app)
                .post('/api/files')
                .send(fileData)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(201);

            expect(response.body.file.fileName).toBe(fileData.fileName);
            expect(response.body.file.description).toBe(fileData.description);
            expect(await Note.findOne({_id: note._id, files: response.body.file.id})).not.toBe(null);
        });
    });

    describe('[PATCH /api/files/:file]', () => {
        test('правка полей файла', async () => {
            const newDescription = 'NEW_DESCRIPTION';
            const response = await request(app)
                .patch(`/api/files/${file._id}`)
                .send({ description: newDescription })
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            file = await File.findById(file._id);

            expect(file.description).toBe(newDescription);
        });
    });

    describe('[POST /api/files/:file/upload]', () => {
        test('загрузка файла', async () => {
            const fsFileId = path.join(process.cwd(), 'src', 'test', 'fixtures', 'image.jpg');
            const fsFileStat = fs.statSync(fsFileId);

            const response = await request(app)
                .post(`/api/files/${file._id}/upload`)
                .attach('file', 'src/test/fixtures/image.jpg')
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            file = await File.findById(file._id);

            expect(file.size).toBe(fsFileStat.size);
        });
    });

    describe('[GET /api/files/:file/download]', () => {
        test('скачивание файла', async () => {
            const response = await request(app)
                .get(`/api/files/${file._id}/download`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toBe('image/jpeg');
            expect(response.headers['content-disposition']).toBe('attachment; filename=file.jpg');

            expect(file.size).toBe(response.body.length);
        });

        test('нельзя скачать чужой файл', async () => {
            const anotherFile = await new File({
                fileName: 'file.jpg',
                description: 'my file',
            }).save();
            await new Note({ ...generateNote(), owner: anotherAuthor, files: [anotherFile._id] }).save();

            const response = await request(app)
                .get(`/api/files/${anotherFile._id}/download`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('[DELETE /api/files/:file]', () => {
        test('удалить файл', async () => {
            const response = await request(app)
                .delete(`/api/files/${file._id}`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(200);

            expect(await File.findById(file._id)).toBe(null);
        });

        test('нельзя удалить чужой файл', async () => {
            const anotherFile = await new File({
                fileName: 'file.jpg',
                description: 'my file',
            }).save();

            const response = await request(app)
                .delete(`/api/files/${anotherFile._id}`)
                .set('Authorization', `JWT ${author.generateJWT()}`);

            expect(response.statusCode).toBe(403);

            expect(await File.findById(anotherFile._id)).not.toBe(null);
        });
    });
});
