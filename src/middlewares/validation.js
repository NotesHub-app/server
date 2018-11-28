import { validationResult } from 'express-validator/check';
import { notFoundResponse, validationErrorResponse } from '../utils/response';

/**
 * Проверка результатов валидации
 * @param code
 * @returns {Function}
 */
export function checkValidation(code = 422) {
    return function(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            switch (code) {
            case 404:
                return notFoundResponse(res);
            default:
                return validationErrorResponse(res, errors);
            }
        }
        next();
    };
}
