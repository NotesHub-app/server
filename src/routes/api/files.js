import { check } from 'express-validator/check';
import validator from 'validator';
import * as _ from 'lodash';
import express from 'express';
import { checkValidation } from '../../middlewares/validation';
import Note from '../../models/Note';
import File from '../../models/File';
import { forbiddenResponse, notFoundResponse } from '../../utils/response';

const router = express.Router();

// Подгрузка File по параметру роута
router.param('file', async (req, res, next, fileId) => {
    if (!validator.isMongoId(fileId)) {
        return notFoundResponse(res);
    }

    const { user } = req;

    const file = await File.findById(fileId);
    if (!file) {
        return notFoundResponse(res);
    }

    // Проверка, что файл принадлежит к одной из зметок принадлежащих пользователю
    const note = Note.findOne({
        $and: [
            // Заметка принадлежит пользователю или группам в которых он состоит
            { $or: [{ owner: user._id }, { group: { $in: user.groupIds } }] },
            { files: { $elemMatch: file._id } },
        ],
    });
    if (!note) {
        return forbiddenResponse(res);
    }

    req.params.file = file;

    return next();
});

/**
 * Создание записи о файле
 */
router.post(
    '/',
    [
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
    },
);

/**
 * Обновить информацию по файлу
 */
router.patch(
    '/:file',
    [
        // Валидация параметров
        check('name').isString(),
        check('description').isString(),

        checkValidation(),
    ],
    async (req, res) => {
        const { file } = req.params;
        const { name, description } = req.body;

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
            },
        );

        await file.save();

        return res.json({ success: true });
    },
);

/**
 * Залить содержимое файла
 */
router.post('/:file/upload', async (req, res) => {
    const { file } = req.params;
});

/**
 * Скачать содержмиое файла
 */
router.get('/files/:file/download', (req, res) => {
    const { file } = req.params;

});

/**
 * Удаление файла
 */
router.delete('/files', (req, res) => {});

export default router;
