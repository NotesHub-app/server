import express from 'express';
import '../config/passport';
import fs from 'fs';
import path from 'path';

export default app => {
    // Инициализируем API роуты
    const apiRoutes = express.Router();

    for (const file of fs.readdirSync(path.join(__dirname, 'api'))) {
        if (file !== '__tests__') {
            require(`./api/${file}`).default(apiRoutes);
        }
    }
    app.use('/api', apiRoutes);

    // 404 handler
    app.use((req, res, next) => {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // catch ERROR handler
    app.use((err, req, res, next) => {
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
