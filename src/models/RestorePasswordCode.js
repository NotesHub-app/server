import mongoose from 'mongoose';

const mongoSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        expireDate: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

const RestorePasswordCode = mongoose.model('RestorePasswordCode', mongoSchema);

export default RestorePasswordCode;
