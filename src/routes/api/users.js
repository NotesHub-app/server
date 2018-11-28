import { requireAuth } from '../../middlewares/auth';

export default router => {
    /**
     * обновить персональные настройки
     */
    router.patch('/users/me', requireAuth, (req, res) => {});
};
