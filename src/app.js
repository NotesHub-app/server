import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import errorHandler from 'errorhandler';
import morgan from 'morgan';
import bluebird from 'bluebird';
import routes from './routes';
import services from './services';

// Инициализируем подключение к БД и модели
import './db';
import './models';

// Делаем bluebird глобальным промисом
global.Promise = bluebird;

const app = express();

// Добавляем сервисы в locals
app.locals = { ...app.locals, ...services };

// Делаем хедеры секурными
app.use(helmet());

// Включаем CORS
app.use(cors());

// Выводим HTTP запросы в консоль
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Настраиваем парсилку входящих данных
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
        parameterLimit: 50000,
    }),
);
app.use(bodyParser.json({ limit: '50mb' }));

// Показываем дебуггерскую инфу в консоль
if (process.env.NODE_ENV !== 'production') {
    app.use(errorHandler());
}

// Подключаем роуты
routes(app);

// Экспортируем сервер для вызова из тестов
export default app;
