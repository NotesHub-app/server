import { validationResult } from 'express-validator/check';
import { notFoundResponse, validationErrorResponse } from '../utils/response';

/**
 * Проверка результатов валидации
 * @param code
 * @returns {Function}
 */
export const checkValidation = (code = 422) => (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (code === 404) {
            return notFoundResponse(res);
        }

        return validationErrorResponse(res, errors);
    }
    return next();
};

/**
 * Проверка владельца заметки
 * @param req
 * @param res
 * @param next
 */
export const noteOwnerCheck = (req, res, next) => {
    const { note } = req.params;
    const { user } = req;

    if (
        // Владельцем должен быть пользователь
        (note.owner && note.owner._id.toString() === user._id.toString()) ||
        // Или группа в которой он состоит
        (note.group && req.user.groupIds.includes(note.group._id.toString()))
    ) {
        return next();
    }

    return notFoundResponse(res);
};
