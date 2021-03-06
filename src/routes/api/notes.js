import { check } from 'express-validator/check';
import validator from 'validator';
import express from 'express';
import Note from '../../models/Note';
import { checkValidation } from '../../middlewares/validation';
import { forbiddenResponse, notFoundResponse, validationErrorResponse } from '../../utils/response';
import { patchDocObj } from '../../utils/data';

const router = express.Router();

// Подгрузка Note по параметру роута
router.param('note', async (req, res, next, noteId) => {
    if (!validator.isMongoId(noteId)) {
        return notFoundResponse(res);
    }

    const { user } = req;

    const note = await Note.findUserNote(noteId, user);

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

// получение дерева заметок
router.get('/', async (req, res) => {
    // Выбираем только заметки принадлежащие пользователю или группам в которых он состоит
    const notes = await Note.find({ $or: [{ owner: req.user._id }, { group: { $in: req.user.groupIds } }] }).select(
        '-content -files',
    );

    res.status(200).json({ notes: notes.map(note => note.toIndexJSON()) });
});

// получение конкретной заметки
router.get('/:note', async (req, res) => {
    const { note } = req.params;

    // Нам нужна также инфа по файлам заметки
    await note.populate('files').execPopulate();

    return res.status(200).json({ note: note.toViewJSON() });
});

// получение истории изменения заметки
router.get('/:note/history', async (req, res) => {
    const { note } = req.params;

    // Нам нужна инфа по авторам правок
    await note.populate('history.author').execPopulate();

    const historyItems = note.history.map(historyItem => ({
        author: historyItem.author.toIndexJSON(),
        dateTime: historyItem.dateTime.getTime(),
    }));

    return res.status(200).json({ history: historyItems });
});

// получение экземпляра истории изменений
router.get('/:note/history/:idx', async (req, res) => {
    const { note } = req.params;
    const idx = Number(req.params.idx);

    // Нам нужна инфа по авторам правок
    await note.populate('history.author').execPopulate();

    const historyItem = note.history[idx];
    if (!historyItem) {
        return notFoundResponse(res);
    }
    const previousHistoryItem = note.history[idx - 1] || { changes: {} };

    for (const field of Object.keys(historyItem.changes)) {
        if (previousHistoryItem.changes[field] === undefined) {
            previousHistoryItem.changes[field] = '';
        }
    }

    const historyDetails = {
        author: historyItem.author.toIndexJSON(),
        dateTime: historyItem.dateTime.getTime(),
        before: previousHistoryItem.changes,
        after: historyItem.changes,
    };

    return res.status(200).json(historyDetails);
});

// Создание заметки
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
            }).select(['_id', 'group']);

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

        newNote.generateHistory(req.user);
        await newNote.save();

        await res.status(201).json({ note: newNote.toViewJSON() });

        await newNote.notifyUpdate(req.headers.wsclientid);
    },
);

// Обновление заметки
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
        check('content').optional(),
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
            const parentNote = await Note.findById(parentId).select(['_id', 'owner', 'group']);

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

        patchDocObj(
            note,
            {
                title,
                icon,
                iconColor,
                content,
            },
            ['content'],
        );

        note.generateHistory(req.user);
        await note.save();

        await res.json({ success: true });

        await note.notifyUpdate(req.headers.wsclientid);
    },
);

// Удаление заметки
router.delete('/:note', allowToEditNote, async (req, res) => {
    const { note } = req.params;

    const idsToRemove = await Note.getChildrenIdsOf(note);
    idsToRemove.push(note._id);

    for (const id of idsToRemove) {
        const noteToRemove = await Note.findById(id);
        if (noteToRemove) {
            await noteToRemove.remove();

            await noteToRemove.notifyRemove(req.headers.wsclientid);
        }
    }

    await res.json({ success: true });
});

export default router;
