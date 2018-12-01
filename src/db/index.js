import mongoose from 'mongoose';
import Promise from 'bluebird';
import dbSeed from './seed';

const options = {
    keepAlive: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    promiseLibrary: Promise,
};

if (process.env.NODE_ENV !== 'test') {
    mongoose.connection
        .on('connecting', () => {
            console.info('[DB] connecting to MongoDB...');
        })
        .on('error', error => {
            console.error(`[DB] Error in MongoDb connection: ${error}`);
            mongoose.disconnect();
        })
        .on('connected', () => {
            console.info('[DB] MongoDB connected!');

            // Показываем дебуггерскую инфу в консоль
            if (process.env.NODE_ENV === 'development') {
                dbSeed();
            }
        })
        .once('open', () => {
            console.info('[DB] MongoDB connection opened!');
        })
        .on('reconnected', () => {
            console.info('[DB] MongoDB reconnected!');
        })
        .on('disconnected', () => {
            console.info('[DB] MongoDB disconnected!');

            // Переподключаемся с задержкой
            setTimeout(() => {
                mongoose.connect(process.env.MONGO_URL, options);
            }, 2000);
        });
}

const connectionPromise = mongoose.connect(process.env.MONGO_URL, options);

// Показываем дебуггерскую инфу в консоль
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
}

export default connectionPromise;
