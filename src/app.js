import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import errorHandler from 'errorhandler';
import morgan from 'morgan';
import routes from './routes';

// Инициализируем подключение к БД и модели
import './db';
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
