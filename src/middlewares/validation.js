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
