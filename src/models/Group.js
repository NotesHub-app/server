import mongoose from 'mongoose';
import User from './User';

const mongoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        users: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    { timestamps: true }
);

class GroupClass {
    /** Для получения своего списка групп */
    toIndexJSON(userId) {
        const { role } = this.users.find(i => i.user.toString() === userId.toString());

        return {
            id: this._id,
            title: this.title,
            myRole: role,
        };
    }
}

mongoSchema.loadClass(GroupClass);

const Group = mongoose.model('Group', mongoSchema);

export default Group;
