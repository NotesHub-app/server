import { check } from 'express-validator/check';
import * as _ from 'lodash';
import dayjs from 'dayjs';
import validator from 'validator';
import express from 'express';
import { checkValidation } from '../../middlewares/validation';
import Group from '../../models/Group';
import { alreadyDoneResponse, forbiddenResponse, notFoundResponse } from '../../utils/response';
import User from '../../models/User';

const router = express.Router();

const validatorMessages = {
    title: 'Название группы должно содержать хотя бы 1 символ',
};

// Подгрузка Group по параметру роута
router.param('group', async (req, res, next, groupId) => {
    if (!validator.isMongoId(groupId)) {
        return notFoundResponse(res);
    }

    const group = await Group.findById(groupId);
    if (!group) {
        return notFoundResponse(res);
    }

    req.params.group = group;

    return next();
});

/**
 * получение списка своих групп
 */
router.get('/', async (req, res) => {
    // Выбираем только заметки принадлежащие пользователю или группам в которых он состоит
    const groups = await Group.find({ _id: { $in: req.user.groupIds } }).select('-inviteCodes');

    res.status(200).json({ groups: groups.map(group => group.toIndexJSON(req.user)) });
});

/**
 * получение детальной инфы о группе
 */
router.get('/:group', async (req, res) => {
    const { group } = req.params;

    res.status(200).json({ group: await group.toViewJSON(req.user) });
});

/**
 * создание новой группы
 */
router.post(
    '/',
    [
        // Валидация параметров
        check('title')
            .isString()
            .isLength({ min: 1 })
            .withMessage(validatorMessages.title),
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

        await res.status(201).json({ group: newGroup.toIndexJSON(req.user) });

        await newGroup.notifyUpdate();
    }
);

/**
 * обновление свойств группы
 */
router.patch(
    '/:group',
    [
        // Валидация параметров
        check('title')
            .optional()
            .isString()
            .isLength({ min: 1 })
            .withMessage(validatorMessages.title),
        check('users')
            .optional()
            .isArray(),
        checkValidation(),
    ],
    async (req, res) => {
        const { group } = req.params;
        const { title, users } = req.body;

        if (!group.checkAllowToEdit(req.user)) {
            return forbiddenResponse(res);
        }

        // Обновляем группы у пользователей
        for (const formUser of users) {
            const user = await User.findById(formUser.id);
            if (formUser.deleted) {
                user.groups = [...user.groups].filter(i => i.group.toString() !== group._id.toString());
            } else if (formUser.role !== undefined) {
                user.groups = [...user.groups].map(item => {
                    if (item.group.toString() === group._id.toString()) {
                        item.role = formUser.role;
                    }
                    return item;
                });
            }
            await user.save();
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
            }
        );
        await group.save();

        await res.json({ success: true, updatedAt: group.updatedAt.getTime() });

        await group.notifyUpdate();
    }
);

/**
 * Удаление группы со всем содержимым
 */
router.delete('/:group', async (req, res) => {
    const { group } = req.params;

    if (!group.checkAllowToEdit(req.user)) {
        return forbiddenResponse(res);
    }

    await group.remove();

    await res.json({ success: true });

    await group.notifyRemove();
});

/**
 * получение инвайт-ссылки для группы
 */
router.get(
    '/:group/invite',
    [
        // Валидация параметров
        check('role').isInt({ gt: 0, lt: 3 }),
        checkValidation(),
    ],
    async (req, res) => {
        const { group } = req.params;
        const { role } = req.body;

        // Пользователь должен быть админом
        if (!req.user.groups.some(i => i.group._id.toString() === group._id.toString() && i.role === 0)) {
            return forbiddenResponse(res);
        }

        const { author, ...codeObj } = group.generateInviteCode({ user: req.user, role });
        await group.save();

        return res.json({ ...codeObj, groupId: group._id.toString() });
    }
);

/**
 * Добавиться в группу
 */
router.post(
    '/:group/join',
    [
        // Валидация параметров
        check('code').isString(),
        checkValidation(),
    ],
    async (req, res) => {
        const { group } = req.params;
        const { code } = req.body;

        const inviteCode = group.inviteCodes.find(
            i =>
                // Код совпадает
                i.code === code &&
                // Код всё еще не просрочен
                dayjs().isBefore(dayjs(i.expireDate))
        );
        if (!inviteCode) {
            return forbiddenResponse(res);
        }

        // Пользователь не должен быть уже в группе
        if (req.user.groupIds.includes(group._id.toString())) {
            return alreadyDoneResponse(res);
        }

        // Выставляем пользователю группу с правами инвайт-ссылки
        req.user.groups.push({ group, role: inviteCode.role });
        await req.user.save();

        return res.json({ success: true });
    }
);

export default router;
