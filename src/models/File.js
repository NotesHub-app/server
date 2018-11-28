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
    { timestamps: true },
);

const File = mongoose.model('File', mongoSchema);

export default File;
