import { requireAuth } from '../../middlewares/auth';

export default router => {
    /**
     * получение списка файлов
     */
    router.get('/files', requireAuth, (req, res) => {});

    /**
     * Загрузка файла
     */
    router.post('/files', requireAuth, (req, res) => {});

    /**
     * Получить файла
     */
    router.get('/files/:file', requireAuth, (req, res) => {});

    /**
     * Изменение атрибутов файла
     */
    router.patch('/files/:file', requireAuth, (req, res) => {});

    /**
     * Удаление файла
     */
    router.delete('/files', requireAuth, (req, res) => {});
};
