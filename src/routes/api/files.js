import { check } from 'express-validator/check';
import validator from 'validator';
import * as _ from 'lodash';
import express from 'express';
import multer from 'multer';
import mongodb from 'mongodb';
import GridFSStorage from 'multer-gridfs-storage';
import { checkValidation } from '../../middlewares/validation';
import Note from '../../models/Note';
import File from '../../models/File';
import { forbiddenResponse, notFoundResponse } from '../../utils/response';
import mongooseConnectionPromise from '../../db/db';

// Настройка multer аплоадера
const upload = multer({
    storage: GridFSStorage({
        db: mongooseConnectionPromise,
    }),
});
const fileUpload = upload.single('file');

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
    const note = await Note.findOne({
        $and: [
            // Заметка принадлежит пользователю или группам в которых он состоит
            { $or: [{ owner: user._id }, { group: { $in: user.groupIds } }] },
            { files: file._id },
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
        check('fileName').isString(),
        check('description').isString(),
        check('noteId').isMongoId(),

        checkValidation(),
    ],
    async (req, res) => {
        const { noteId, fileName, description } = req.body;

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
            fileName,
            description,
        });
        file.save();

        return res.status(201).json({ file: file.toIndexJSON() });
    },
);

/**
 * Обновить информацию по файлу
 */
router.patch(
    '/:file',
    [
        // Валидация параметров
        check('fileName').isString(),
        check('description').isString(),

        checkValidation(),
    ],
    async (req, res) => {
        const { file } = req.params;
        const { fileName, description } = req.body;

        // Обновляем только те поля которые пришли с запросом
        _.forEach(
            {
                fileName,
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
router.post('/:file/upload', fileUpload, async (req, res) => {
    const { file } = req.params;
    const savedFile = req.file;

    file.fsFileName = savedFile.filename;
    file.mimeType = savedFile.mimetype;
    file.size = savedFile.size;
    await file.save();

    return res.json({ success: true });
});

/**
 * Скачать содержмиое файла
 */
router.get('/:file/download', async (req, res) => {
    const { file } = req.params;

    // Если файл еще не закачали
    if (!file.fsFileName) {
        return notFoundResponse(res);
    }

    const bucket = new mongodb.GridFSBucket((await mongooseConnectionPromise).connection.db);

    res.setHeader('Content-type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename=${file.fileName}`);
    return bucket.openDownloadStreamByName(file.fsFileName).pipe(res);
});

/**
 * Удаление файла
 */
router.delete('/files', (req, res) => {});

export default router;
