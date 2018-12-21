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

    // 404 handler
    app.use((req, res, next) => {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // catch ERROR handler
    app.use((err, req, res) => {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(err.stack);
        }

        res.status(err.status || 500);

        res.json({
            errors: {
                message: err.message,
                error: process.env.NODE_ENV !== 'production' ? err : undefined,
            },
        });
    });
};
