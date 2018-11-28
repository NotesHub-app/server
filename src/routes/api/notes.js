import { check, param } from 'express-validator/check';
import * as _ from 'lodash';
import { requireAuth } from '../../middlewares/auth';
import Note from '../../models/Note';
import { checkValidation } from '../../middlewares/validation';
import { notFoundResponse } from '../../utils/response';

export default router => {
    /**
     * получение дерева заметок
     */
    router.get('/notes', requireAuth, async (req, res) => {
        const userId = req.user._id;
        const userGroups = req.user.groups;

        // Выбираем только заметки принадлежащие пользователю или группам в которых он состоит
        const notes = await Note.find({ $or: [{ owner: userId }, { group: { $in: userGroups } }] });

        res.status(200).json({ notes: notes.map(note => note.toIndexJSON()) });
    });

    /**
     * получение конкретной заметки
     */
    router.get(
        '/notes/:id',
        [
            requireAuth,

            // Валидация параметров
            param('id').isMongoId(),
            checkValidation(404),
        ],
        async (req, res) => {
            const noteId = req.params.id;
            const userId = req.user._id;
            const userGroups = req.user.groups;

            const note = await Note.findOne({
                $and: [
                    // ID заметки
                    { _id: noteId },
                    // Заметка принадлежит пользователю или группам в которых он состоит
                    { $or: [{ owner: userId }, { group: { $in: userGroups } }] },
                ],
            });

            if (!note) {
                return notFoundResponse(res);
            }

            return res.status(200).json({ note: note.toViewJSON() });
        },
    );

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
            const userId = req.user._id;

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
                newNote.owner = userId;
            }

            await newNote.save();

            res.status(201).json({ note: newNote.toViewJSON() });
        },
    );

    /**
     * Обновление заметки
     */
    router.patch(
        '/notes/:id',
        [
            requireAuth,

            // Валидация ID
            param('id').isMongoId(),
            checkValidation(404),

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
            const noteId = req.params.id;
            const userId = req.user._id;
            const userGroups = req.user.groups;

            const note = await Note.findOne({
                $and: [
                    // ID заметки
                    { _id: noteId },
                    // Заметка принадлежит пользователю или группам в которых он состоит
                    { $or: [{ owner: userId }, { group: { $in: userGroups } }] },
                ],
            });

            if (!note) {
                return notFoundResponse(res);
            }

            const { title, icon, iconColor, content } = req.body;

            // Обновляем только те поля которые пришли с запросом
            _.map(
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
    router.delete(
        '/notes/:id',
        [
            requireAuth,

            // Валидация ID
            param('id').isMongoId(),
            checkValidation(404),
        ],
        async (req, res) => {
            const noteId = req.params.id;
            const userId = req.user._id;
            const userGroups = req.user.groups;

            const note = await Note.findOne({
                $and: [
                    // ID заметки
                    { _id: noteId },
                    // Заметка принадлежит пользователю или группам в которых он состоит
                    { $or: [{ owner: userId }, { group: { $in: userGroups } }] },
                ],
            });

            if (!note) {
                return notFoundResponse(res);
            }

            await note.remove();

            return res.json({ success: true });
        },
    );
};
