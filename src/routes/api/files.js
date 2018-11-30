import { check } from 'express-validator/check';
import validator from 'validator';
import { requireAuth } from '../../middlewares/auth';
import { checkValidation } from '../../middlewares/validation';
import Note from '../../models/Note';
import File from '../../models/File';
import { forbiddenResponse, notFoundResponse } from '../../utils/response';
import * as _ from 'lodash';

export default router => {
    // Подгрузка File по параметру роута
    router.param('file', async (req, res, next, fileId) => {
        if (!validator.isMongoId(fileId)) {
            return notFoundResponse(res);
        }

        const file = await File.findById(fileId);
        if (!file) {
            return notFoundResponse(res);
        }

        req.params.file = file;

        return next();
    });

    /**
     * Создание записи о файле
     */
    router.post(
        '/files',
        [
            requireAuth,

            // Валидация параметров
            check('name').isString(),
            check('description').isString(),
            check('noteId').isMongoId(),

            checkValidation(),
        ],
        async (req, res) => {
            const { noteId, name, description } = req.body;

            // Проверяем, что файл привязывают к своей заметке
            const note = Note.findOne({
                $and: [
                    // ID заметки
                    { _id: noteId },
                    // Заметка принадлежит пользователю или группам в которых он состоит
                    { $or: [{ owner: req.user._id }, { group: { $in: req.user.groupIds } }] },
                ],
            });
            if (!note) {
                return forbiddenResponse(res);
            }

            const file = new File({
                name,
                description,
            });
            file.save();

            return res.status(201).json({ group: file.toIndexJSON() });
        }
    );

    /**
     * Обновить информацию по файлу
     */
    router.patch(
        '/files/:file',
        [
            requireAuth,

            // Валидация параметров
            check('name').isString(),
            check('description').isString(),

            checkValidation(),
        ],
        async (req, res) => {
            const { file } = req.params;
            const { name, description } = req.body;

            // Проверяем что файл принадлежит к одной из зметок принадлежащих пользователю
            const note = Note.findOne({
                $and: [
                    // Заметка принадлежит пользователю или группам в которых он состоит
                    { $or: [{ owner: req.user._id }, { group: { $in: req.user.groupIds } }] },
                    { files: { $elemMatch: file._id } },
                ],
            });
            if (!note) {
                return forbiddenResponse(res);
            }

            // Обновляем только те поля которые пришли с запросом
            _.forEach(
                {
                    name,
                    description,
                },
                (value, field) => {
                    if (!_.isUndefined(value)) {
                        file[field] = value;
                    }
                }
            );

            await note.save();

            return res.json({ success: true });
        }
    );

    /**
     * Залить содержимое файла
     */
    router.post('/files/:file/upload', requireAuth, async (req, res) => {
        const { file } = req.params;

        // Проверяем что файл принадлежит к одной из зметок принадлежащих пользователю
        const note = Note.findOne({
            $and: [
                // Заметка принадлежит пользователю или группам в которых он состоит
                { $or: [{ owner: req.user._id }, { group: { $in: req.user.groupIds } }] },
                { files: { $elemMatch: file._id } },
            ],
        });
        if (!note) {
            return forbiddenResponse(res);
        }
    });

    /**
     * Скачать содержмиое файла
     */
    router.get('/files/:file/download', requireAuth, (req, res) => {});

    /**
     * Удаление файла
     */
    router.delete('/files', requireAuth, (req, res) => {});
};
