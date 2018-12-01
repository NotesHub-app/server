import mongoose from 'mongoose';
import Promise from 'bluebird';
import dbSeed from './seed';

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
        });
}

const connectionPromise = mongoose.connect(process.env.MONGO_URL, {
    promiseLibrary: Promise,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 500,
    poolSize: 10,
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
});

// Показываем дебуггерскую инфу в консоль
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
}

export default connectionPromise;
