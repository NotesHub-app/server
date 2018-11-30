import { check } from 'express-validator/check';
import * as _ from 'lodash';
import validator from 'validator';
import { requireAuth } from '../../middlewares/auth';
import Note from '../../models/Note';
import { checkValidation, noteOwnerCheck } from '../../middlewares/validation';
import { forbiddenResponse, notFoundResponse } from '../../utils/response';

export default router => {
    // Подгрузка Note по параметру роута
    router.param('note', async (req, res, next, noteId) => {
        if (!validator.isMongoId(noteId)) {
            return notFoundResponse(res);
        }

        const note = await Note.findById(noteId);

        if (!note) {
            return notFoundResponse(res);
        }

        req.params.note = note;

        return next();
    });

    /**
     * получение дерева заметок
     */
    router.get('/notes', requireAuth, async (req, res) => {
        // Выбираем только заметки принадлежащие пользователю или группам в которых он состоит
        const notes = await Note.find({ $or: [{ owner: req.user._id }, { group: { $in: req.user.groupIds } }] });

        res.status(200).json({ notes: notes.map(note => note.toIndexJSON()) });
    });

    /**
     * получение конкретной заметки
     */
    router.get('/notes/:note', [requireAuth, noteOwnerCheck], async (req, res) => {
        const { note } = req.params;

        return res.status(200).json({ note: note.toViewJSON() });
    });

    /**
     * Создание заметки
     */
    router.post(
        '/notes',
        [
            requireAuth,

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
        }
    );

    /**
     * Обновление заметки
     */
    router.patch(
        '/notes/:note',
        [
            requireAuth,
            noteOwnerCheck,

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
                }
            );

            await note.save();

            return res.json({ success: true });
        }
    );

    /**
     * Удаление заметки
     */
    router.delete('/notes/:note', [requireAuth, noteOwnerCheck], async (req, res) => {
        const { note } = req.params;

        if (!note.checkAllowToEdit(req.user)) {
            return forbiddenResponse(res);
        }

        await note.remove();

        return res.json({ success: true });
    });
};
