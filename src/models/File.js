import mongoose from 'mongoose';

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
