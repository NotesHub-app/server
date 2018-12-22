import { validationResult } from 'express-validator/check';
import { validationErrorResponse } from '../utils/response';

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
