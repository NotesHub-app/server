/**
 * Ответ на отсуствие элемента (404 ошибка)
 * @param res
 * @param message
 * @returns {*}
 */
export function notFoundResponse(res, message = 'Item does not exist') {
    return res.status(404).json({ error: message });
}

/**
 * Ответ на ошибку валидации входящих параметров
 * @param res
 * @param errors
 * @returns {*}
 */
export function validationErrorResponse(res, errors = []) {
    return res.status(422).json({ errors });
}

/**
 * Отказано в доступе
 * @param res
 * @param message
 * @returns {*}
 */
export function forbiddenResponse(res, message = 'Forbidden action') {
    return res.status(403).json({ error: message });
}

/**
 * Ответ когда пользователь пытается сделать то, что уже делал ранее и в этом нет необходимости.
 * @param res
 * @param message
 * @returns {*}
 */
export function alreadyDoneResponse(res, message = 'Already done operation!') {
    return res.status(409).json({ error: message });
}
