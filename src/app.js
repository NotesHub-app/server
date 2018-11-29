import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import errorHandler from 'errorhandler';
import mongoose from 'mongoose';
import morgan from 'morgan';
import Promise from 'bluebird';
import routes from './routes';

// Инициализируем модели
import './models';

const app = express();

// Отключаем в хедерах сообщение о том что используется Express
app.disable('x-powered-by');

// Включаем CORS
app.use(cors());

// Выводим HTTP запросы в консоль
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

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
mongoose.connect(
    process.env.MONGO_URL,
    {
        keepAlive: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 1000,
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
    },
);

if (process.env.NODE_ENV === 'development') {
    app.use(errorHandler());
    mongoose.set('debug', true);
}

// Подключаем роуты
routes(app);

// Экспортируем сервер для вызова из тестов
export default app;
