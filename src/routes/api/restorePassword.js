export default router => {
    /**
     * восстановление пароля (в теле указываем email)
     */
    router.post('/restorePassword', (req, res) => {});

    /**
     * восстановление пароля (в теле код из письма и новый пароль пользователя)
     */
    router.post('/restorePassword/confirm', (req, res) => {});
};
