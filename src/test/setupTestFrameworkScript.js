import mongoose from 'mongoose';
// Приложение должно быть инициализированным (там монго и всё такое)
import '../app';

afterAll(async () => {
    await mongoose.connection.close();
});
