import { check, param } from 'express-validator/check';
import * as _ from 'lodash';
import dayjs from 'dayjs';
import { requireAuth } from '../../middlewares/auth';
import { checkValidation } from '../../middlewares/validation';
import Group from '../../models/Group';
import { alreadyDoneResponse, forbiddenResponse, notFoundResponse } from '../../utils/response';

export default router => {
    /**
     * получение списка своих групп
     */
    router.get('/groups', requireAuth, async (req, res) => {
        // Выбираем только заметки принадлежащие пользователю или группам в которых он состоит
        const groups = await Group.find({ _id: { $in: req.user.groupIds } });

        res.status(200).json({ groups: groups.map(group => group.toIndexJSON(req.user)) });
    });

    /**
     * создание новой группы
     */
    router.post(
        '/groups',
        [
            requireAuth,

            // Валидация параметров
            check('title')
                .isString()
                .isLength({ min: 1 }),
            checkValidation(),
        ],
        async (req, res) => {
            const { title } = req.body;

            const newGroup = new Group({
                title,
            });
            await newGroup.save();

            // При создании группы делаем создаля админом
            req.user.groups.push({
                group: newGroup,
                role: 0,
            });
            await req.user.save();

            res.status(201).json({ group: newGroup.toIndexJSON(req.user) });
        },
    );

    /**
     * обновление свойств группы
     */
    router.patch(
        '/groups/:id',
        [
            requireAuth,

            // Валидация ID
            param('id').isMongoId(),
            checkValidation(404),

            // Валидация параметров
            check('title')
                .isString()
                .isLength({ min: 1 }),
            checkValidation(),
        ],
        async (req, res) => {
            const groupId = req.params.id;
            const { title } = req.body;

            const group = await Group.findById(groupId);
            if (!group) {
                return notFoundResponse(res);
            }

            if (!group.checkAllowToEdit(req.user)) {
                return forbiddenResponse(res);
            }

            // Обновляем только те поля которые пришли с запросом
            _.forEach(
                {
                    title,
                },
                (value, field) => {
                    if (!_.isUndefined(value)) {
                        group[field] = value;
                    }
                },
            );

            await group.save();

            return res.json({ success: true });
        },
    );

    /**
     * удаление группы со всем содержимым
     */
    router.delete(
        '/groups/:id',
        [
            requireAuth,

            // Валидация ID
            param('id').isMongoId(),
            checkValidation(404),
        ],
        async (req, res) => {
            const groupId = req.params.id;

            const group = await Group.findById(groupId);
            if (!group) {
                return notFoundResponse(res);
            }

            if (!group.checkAllowToEdit(req.user)) {
                return forbiddenResponse(res);
            }

            await group.remove();

            return res.json({ success: true });
        },
    );

    /**
     * получение инвайт-ссылки для группы
     */
    router.get(
        '/groups/:id/invite',
        [
            requireAuth,

            // Валидация ID
            param('id').isMongoId(),
            checkValidation(404),

            // Валидация параметров
            check('role').isInt({ gt: 0, lt: 3 }),
            checkValidation(),
        ],
        async (req, res) => {
            const groupId = req.params.id;
            const { role } = req.body;

            const group = await Group.findById(groupId);
            if (!group) {
                return notFoundResponse(res);
            }

            // Пользователь должен быть админом
            if (!req.user.groups.some(i => i.group._id.toString() === group._id.toString() && i.role === 0)) {
                return forbiddenResponse(res);
            }

            const { author, ...codeObj } = await group.generateInviteCode({ user: req.user, role });

            return res.json({ ...codeObj, groupId });
        },
    );

    /**
     * Добавиться в группу
     */
    router.post(
        '/groups/:id/join',
        [
            requireAuth,

            // Валидация ID
            param('id').isMongoId(),
            checkValidation(404),

            // Валидация параметров
            check('code').isString(),
            checkValidation(),
        ],
        async (req, res) => {
            const groupId = req.params.id;
            const { code } = req.body;

            const group = await Group.findById(groupId);
            if (!group) {
                return notFoundResponse(res);
            }

            const inviteCode = group.inviteCodes.find(
                i =>
                    // Код совпадает
                    i.code === code &&
                    // Код всё еще не просрочен
                    dayjs().isBefore(dayjs(i.expireDate)),
            );
            if (!inviteCode) {
                return forbiddenResponse(res);
            }

            // Пользователь не должен быть уже в группе
            if (req.user.groupIds.includes(groupId)) {
                return alreadyDoneResponse(res);
            }

            // Выставляем пользователю группу с правами инвайт-ссылки
            req.user.groups.push({ group, role: inviteCode.role });
            await req.user.save();

            return res.json({ success: true });
        },
    );
};
