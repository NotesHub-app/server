/**
 * Ответ на отсуствие элемента (404 ошибка)
 * @param res
 * @param message
 * @returns {*}
 */
export function notFoundResponse(res, message = 'Item does not exist') {
    return res.status(404).json({ error: 'Item does not exist' });
}

/**
 * Ответ на ошибку валидации входящих параметров
 * @param res
 * @param errors
 * @returns {*}
 */
export function validationErrorResponse(res, errors) {
    return res.status(422).json({ errors: errors.array() });
}
