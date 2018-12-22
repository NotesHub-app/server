import express from 'express';
import '../config/passport';
import authApiRouter from './api/auth';
import filesApiRouter from './api/files';
import groupsApiRouter from './api/groups';
import notesApiRouter from './api/notes';
import registrationApiRouter from './api/registration';
import restorePasswordApiRouter from './api/restorePassword';
import usersApiRouter from './api/users';
import directDownloadApiRouter from './api/directDownload';
import { requireAuth, requireFileAuth } from '../middlewares/auth';
import { serverConfiguration } from '../config';

export default app => {
    // Инициализируем API роуты
    const apiRouter = express.Router();

    apiRouter.use('/auth', [], authApiRouter);
    apiRouter.use('/registration', [], registrationApiRouter);
    apiRouter.use('/restorePassword', [], restorePasswordApiRouter);
    apiRouter.use('/notes', [requireAuth], notesApiRouter);
    apiRouter.use('/files', [requireAuth], filesApiRouter);
    apiRouter.use('/groups', [requireAuth], groupsApiRouter);
    apiRouter.use('/users', [requireAuth], usersApiRouter);
    apiRouter.use('/directDownload', [requireFileAuth], directDownloadApiRouter);

    // Получение настроек сервера
    apiRouter.get('/serverConfiguration', (req, res) => {
        res.json(serverConfiguration);
    });

    app.use('/api', apiRouter);

    // обертка для 404
    app.use((req, res, next) => {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // Обработка всех ошибок
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(err.stack);
        }

        res.status(err.status || 500);

        res.json({
            message: err.message,
            error: process.env.NODE_ENV !== 'production' ? err : true,
        });
    });
};
