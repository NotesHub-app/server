import models from '../models';

/**
 * Удалить данные всех моделей из базы (для тестов)
 */
export async function resetDB() {
    // eslint-disable-next-line no-restricted-syntax
    for (const model of Object.values(models)) {
        await model.remove();
    }
}
