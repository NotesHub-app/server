import { requireAuth, requireLogin } from '../../middlewares/auth';
import { notFoundResponse } from '../../utils/response';

export default router => {
    function getAuthJSON(req, res) {
        if (!req.user) {
            return notFoundResponse('Unknown user');
        }
        return res.status(200).json(req.user.toAuthJSON());
    }

    /**
     * Авторизация
     */
    router.post('/auth/login', requireLogin, getAuthJSON);

    /**
     * Обновление токена
     */
    router.get('/auth/keep-token', requireAuth, getAuthJSON);
};
