import express from 'express';
import '../config/passport';
import authApiRoutes from './api/auth';
import filesApiRoutes from './api/files';
import groupsApiRoutes from './api/groups';
import notesApiRoutes from './api/notes';
import registrationApiRoutes from './api/registration';
import restorePasswordApiRoutes from './api/restorePassword';
import usersApiRoutes from './api/users';

export default app => {
    // Инициализируем API роуты
    const apiRouter = express.Router();

    authApiRoutes(apiRouter);
    filesApiRoutes(apiRouter);
    groupsApiRoutes(apiRouter);
    notesApiRoutes(apiRouter);
    registrationApiRoutes(apiRouter);
    restorePasswordApiRoutes(apiRouter);
    usersApiRoutes(apiRouter);

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
