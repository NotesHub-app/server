import mongoose from 'mongoose';

const mongoSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
        },
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        expireDate: {
            type: Date,
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true },
);

const InviteCode = mongoose.model('InviteCode', mongoSchema);

export default InviteCode;
