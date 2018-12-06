import { check } from 'express-validator/check';
import * as _ from 'lodash';
import validator from 'validator';
import express from 'express';
import mongoose from 'mongoose';
import Note from '../../models/Note';
import { checkValidation } from '../../middlewares/validation';
import { forbiddenResponse, notFoundResponse, validationErrorResponse } from '../../utils/response';

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
 * Middleware проверки, что пользователь может редактировать заметку
 */
const allowToEditNote = (req, res, next) => {
    const { note } = req.params;
    if (!note.checkAllowToEdit(req.user)) {
        return forbiddenResponse(res);
    }

    return next();
};

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
        check('parentId')
            .optional()
            .isMongoId(),
        check('groupId')
            .optional()
            .isMongoId(),
        checkValidation(),
    ],
    async (req, res) => {
        const { user } = req;
        const { title, icon, iconColor, content, parentId } = req.body;
        let { groupId } = req.body;

        // Если задана родительская заметка
        if (parentId) {
            const parentNote = await await Note.findOne({
                $and: [
                    { _id: parentId },
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

            if (
                // Если роодиельской заметки вообще нет
                !parentNote
            ) {
                return validationErrorResponse(res);
            }

            if (parentNote.group) {
                // Автоматически назнваем groupId по родительской заметке
                groupId = parentNote.group._id.toString();
            }
        }

        const newNote = new Note({
            parent: parentId,
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

        return res.status(201).json({ note: newNote.toViewJSON() });
    }
);

/**
 * Обновление заметки
 */
router.patch(
    '/:note',
    [
        allowToEditNote,

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
        check('parentId')
            .optional()
            .isMongoId(),
        checkValidation(),
    ],
    async (req, res) => {
        const { note } = req.params;

        const { title, icon, iconColor, content, parentId } = req.body;

        // Если меняем родителя - должны быть уверены, что владельцы родителя такиеже
        if (parentId) {
            const parentNote = await Note.findById(parentId);

            const prevParent = note.parent;
            if (!prevParent) {
                return validationErrorResponse(res);
            }

            if (
                // Если роодиельской заметки вообще нет
                !parentNote ||
                // Или если она не групповая
                (parentNote.group &&
                    parentNote.group._id.toString() !== (prevParent.group && prevParent.group._id.toString())) ||
                // Или если она не пользовательская
                (parentNote.owner && parentNote.owner._id.toString() !== req.user._id.toString())
            ) {
                return validationErrorResponse(res);
            }
        }

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
            }
        );

        await note.save();

        return res.json({ success: true });
    }
);

/**
 * Удаление заметки
 */
router.delete('/:note', allowToEditNote, async (req, res) => {
    const { note } = req.params;

    const idsToRemove = await Note.getChildrenIdsOf(note);
    idsToRemove.push(note._id);

    await Note.remove({ _id: { $in: idsToRemove } });

    return res.json({ success: true });
});

export default router;
