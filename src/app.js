import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import errorHandler from 'errorhandler';
import mongoose from 'mongoose';
import routes from './routes';
import morgan from 'morgan';
import fs from 'fs';
import Promise from 'bluebird';

const app = express();
app.disable('x-powered-by');

app.use(cors());

// Normal express config defaults
app.use(morgan('dev'));
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
        parameterLimit: 50000,
    }),
);
app.use(bodyParser.json({ limit: '50mb' }));

app.use(session({ secret: 'conduit', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGO_URL, {
    keepAlive: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
});

if (process.env.NODE_ENV === 'development') {
    app.use(errorHandler());
    mongoose.set('debug', true);
}

//Инициализируем модели
import './models';

routes(app);

//Экспортируем сервер для вызова из тестов
export default app;
