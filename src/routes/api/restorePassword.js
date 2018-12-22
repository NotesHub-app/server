import { check } from 'express-validator/check';
import express from 'express';
import * as _ from 'lodash';
import { checkValidation } from '../../middlewares/validation';
import User from '../../models/User';
import { validationErrorResponse } from '../../utils/response';

const router = express.Router();

// восстановление пароля (в теле указываем email)
router.post(
    '/',
    [
        // Валидация параметров
        check('email')
            .isEmail()
            .withMessage('Email адрес имеет неверный формат'),
        checkValidation(),
    ],
    async (req, res) => {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // В данном запросе нужно всё равно отдавать успешный ответ,
            // чтоб не смогли набрутить базу зарегистрированных емейлов
            return res.json({ success: true });
        }

        user.generateRestorePasswordCode();
        await user.save();

        const { code } = _.last(user.restorePasswordCodes);

        if (process.env.NODE_ENV === 'development') {
            console.info(`:::: RESTORE PASSWORD CODE FOR ${user.email}:    ${code}`);
        }
        if (process.env.NODE_ENV === 'production') {
            req.app.locals.mailService.sendMail({
                to: email,
                subject: 'Восстановление пароля',
                text: `Код для восстановления пароля: ${code}`,
            });
        }

        return res.json({ success: true });
    },
);

// восстановление пароля (в теле код из письма и новый пароль пользователя)
router.post(
    '/confirm',
    [
        // Валидация параметров
        check('code').isString(),
        check('password')
            .isLength({ min: 8 })
            .withMessage('Пароль должен содержать минимум 8 символов'),
        checkValidation(),
    ],
    async (req, res) => {
        const { code, password } = req.body;

        const user = await User.findOne({
            restorePasswordCodes: {
                $elemMatch: {
                    $and: [{ code }, { codeExpire: { $gt: new Date() } }],
                },
            },
        });

        if (!user) {
            return validationErrorResponse(res, [
                {
                    location: 'body',
                    msg: 'Неверный код',
                    param: 'code',
                },
            ]);
        }

        user.password = password;
        await user.save();

        return res.json({ success: true });
    },
);

export default router;
