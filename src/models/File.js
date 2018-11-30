import mongoose from 'mongoose';

const mongoSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

class FileClass {
    /**
     * Преобразовать к объекту для выдачи в списках
     */
    toIndexJSON() {
        return {
            id: this._id,
            name: this.name,
            description: this.description,
        };
    }
}

mongoSchema.loadClass(FileClass);

const File = mongoose.model('File', mongoSchema);

export default File;
