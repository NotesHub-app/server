import { validationResult } from 'express-validator/check';
import request from 'superagent';
import { validationErrorResponse } from '../utils/response';
import { GOOGLE_RECAPTCHA_SECRET_KEY, serverConfiguration } from '../config';

/**
 * Проверка результатов валидации
 * @returns {Function}
 */
export const checkValidation = () => (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
    }
    return next();
};

/**
 * Проверка google-recaptcha токена
 * @param tokenField
 * @returns {Function}
 */
export const checkRecaptcha = (tokenField = 'recaptchaToken') => async (req, res, next) => {
    const recaptchaToken = req.body[tokenField];

    // Во время тестирования не используем проверку
    if (process.env.NODE_ENV === 'test') {
        return next();
    }

    if (serverConfiguration.useRecaptcha) {
        // Проверяем результат рекапчи
        const {
            body: { success, score },
        } = await request
            .post('https://www.google.com/recaptcha/api/siteverify')
            .type('form')
            .send({ secret: GOOGLE_RECAPTCHA_SECRET_KEY, response: recaptchaToken })
            .set('accept', 'json');

        // Если проверка капчи не удалась или низкий рейтинг
        if (!success || score < 0.5) {
            return res.status(403).json({ error: 'Невозможно произвести регистрацию.' });
        }
    }

    return next();
};
