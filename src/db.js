import mongoose from 'mongoose';
import Promise from 'bluebird';

// Инициализируем Mongoose
mongoose.Promise = Promise;
const mongooseConnection = mongoose.connect(process.env.MONGO_URL, {
    keepAlive: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
});

// Показываем дебуггерскую инфу в консоль
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
}

export default mongooseConnection;
