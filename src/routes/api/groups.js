import { check } from 'express-validator/check';
import { requireAuth } from '../../middlewares/auth';
import { checkValidation } from '../../middlewares/validation';
import Group from '../../models/Group';

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
                users: [
                    {
                        user: req.user._id,
                        role: 0,
                    },
                ],
            });

            await newGroup.save();

            res.status(201).json({ group: newGroup.toIndexJSON(req.user) });
        },
    );

    /**
     * обновление свойств группы
     */
    router.patch('/groups/:id', requireAuth, (req, res) => {});

    /**
     * удаление группы со всем содержимым
     */
    router.delete('/groups/:id', requireAuth, (req, res) => {});

    /**
     * получение инвайт-ссылки для группы
     */
    router.get('/groups/:id/invite', requireAuth, (req, res) => {});
};
