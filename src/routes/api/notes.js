import { check } from 'express-validator/check';
import * as _ from 'lodash';
import validator from 'validator';
import express from 'express';
import Note from '../../models/Note';
import { checkValidation } from '../../middlewares/validation';
import { forbiddenResponse, notFoundResponse } from '../../utils/response';

const router = express.Router();

// Подгрузка Note по параметру роута
router.param('note', async (req, res, next, noteId) => {
    if (!validator.isMongoId(noteId)) {
        return notFoundResponse(res);
    }

    const { user } = req;

    const note = await Note.findOne({
        $and: [
            { _id: noteId },
            {
                $or: [
                    // Владельцем должен быть пользователь
                    { owner: user },
                    // Или группа в которой он состоит
                    { group: { $in: user.groupIds } },
                ],
            },
        ],
    });

    if (!note) {
        return notFoundResponse(res);
    }

    req.params.note = note;

    return next();
});

/**
 * получение дерева заметок
 */
router.get('/', async (req, res) => {
    // Выбираем только заметки принадлежащие пользователю или группам в которых он состоит
    const notes = await Note.find({ $or: [{ owner: req.user._id }, { group: { $in: req.user.groupIds } }] });

    res.status(200).json({ notes: notes.map(note => note.toIndexJSON()) });
});

/**
 * получение конкретной заметки
 */
router.get('/:note', async (req, res) => {
    const { note } = req.params;

    return res.status(200).json({ note: note.toViewJSON() });
});

/**
 * Создание заметки
 */
router.post(
    '/',
    [
        // Валидация параметров
        check('title').isString(),
        check('icon').isString(),
        check('iconColor').isString(),
        check('content').isString(),
        check('groupId')
            .optional()
            .isMongoId(),
        checkValidation(),
    ],
    async (req, res) => {
        const { title, icon, iconColor, content, groupId } = req.body;

        const newNote = new Note({
            title,
            icon,
            iconColor,
            content,
        });

        if (groupId) {
            // Если была указана группа - сохраняем как групповую заметку
            newNote.group = groupId;
        } else {
            // Иначе указываем владельцем пользователя
            newNote.owner = req.user._id;
        }

        await newNote.save();

        res.status(201).json({ note: newNote.toViewJSON() });
    },
);

/**
 * Обновление заметки
 */
router.patch(
    '/:note',
    [
        // Валидация параметров
        check('title')
            .optional()
            .isString(),
        check('icon')
            .optional()
            .isString(),
        check('iconColor')
            .optional()
            .isString(),
        check('content')
            .optional()
            .isString(),
        checkValidation(),
    ],
    async (req, res) => {
        const { note } = req.params;

        if (!note.checkAllowToEdit(req.user)) {
            return forbiddenResponse(res);
        }

        const { title, icon, iconColor, content } = req.body;

        // Обновляем только те поля которые пришли с запросом
        _.forEach(
            {
                title,
                icon,
                iconColor,
                content,
            },
            (value, field) => {
                if (!_.isUndefined(value)) {
                    note[field] = value;
                }
            },
        );

        await note.save();

        return res.json({ success: true });
    },
);

/**
 * Удаление заметки
 */
router.delete('/:note', async (req, res) => {
    const { note } = req.params;

    if (!note.checkAllowToEdit(req.user)) {
        return forbiddenResponse(res);
    }

    await note.remove();

    return res.json({ success: true });
});

export default router;
