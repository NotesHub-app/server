import models from '../models';

/**
 * Удалить данные всех моделей из базы (для тестов)
 */
export async function resetDB() {
    for (const model of Object.values(models)) {
        await model.remove();
    }
}
