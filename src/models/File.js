import mongoose from 'mongoose';
import mongodb from 'mongodb';
import mongooseConnectionPromise from '../db';

const mongoSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        fsFileId: {
            type: String,
        },
        mimeType: {
            type: String,
        },
        size: {
            type: Number,
        },
    },
    { timestamps: true },
);

mongoSchema.pre('remove', async function(next) {
    // При удалении записи о файле удаляем также непосредственно сам файл
    if (this.fsFileId) {
        const bucket = new mongodb.GridFSBucket((await mongooseConnectionPromise).connection.db);
        await bucket.delete(mongoose.Types.ObjectId(this.fsFileId));
    }

    next();
});

class FileClass {
    /**
     * Преобразовать к объекту для выдачи в списках
     */
    toIndexJSON() {
        return {
            id: this._id,
            fileName: this.fileName,
            description: this.description,
            size: this.size,
            mimeType: this.mimeType,
        };
    }
}

mongoSchema.loadClass(FileClass);

const File = mongoose.model('File', mongoSchema);

export default File;
