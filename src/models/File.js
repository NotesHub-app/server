import mongoose from 'mongoose';
import mongodb from 'mongodb';
import uuidv4 from 'uuid/v4';

const mongoSchema = new mongoose.Schema(
    {
        // Имя файла
        fileName: {
            type: String,
            required: true,
        },

        // Описание файла
        description: {
            type: String,
        },

        // ID файла из grid-fs
        fsFileId: {
            type: String,
        },

        // Mime-Type файла
        mimeType: {
            type: String,
        },

        // Размер в байтах
        size: {
            type: Number,
        },

        // Уникальный код файла для скачивания
        // (Не используем обычный _id для скачивания чтоб исключить возможность брута)
        downloadCode: { type: String, unique: true },
    },
    { timestamps: true },
);

mongoSchema.pre('save', async function() {
    const file = this;

    // При сохранении добавляем код для скачивания
    if (!file.downloadCode) {
        file.downloadCode = uuidv4();
    }
});

mongoSchema.pre('remove', async function(next) {
    // При удалении записи о файле удаляем также непосредственно сам файл
    if (this.fsFileId) {
        const bucket = new mongodb.GridFSBucket(mongoose.connection.db);
        await bucket.delete(mongoose.Types.ObjectId(this.fsFileId));
    }

    next();
});

class FileClass {
    /** Преобразовать к объекту для выдачи в списках */
    toIndexJSON() {
        return {
            id: this._id,
            fileName: this.fileName,
            description: this.description,
            size: this.size,
            mimeType: this.mimeType,
            downloadCode: this.downloadCode,
            updatedAt: this.updatedAt.getTime(),
        };
    }
}

mongoSchema.loadClass(FileClass);

const File = mongoose.model('File', mongoSchema);

export default File;
