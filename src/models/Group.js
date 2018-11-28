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
    { timestamps: true },
);

mongoSchema.pre('save', async function() {
    const group = this;

    // Если поменялись пользователи у группы
    if (group.isModified('users')) {
        const userIds = [];
        for (const groupUser of group.users) {
            const userId = groupUser.user;
            userIds.push(userId);
        }

        // Добавляем группу для всех пользователей массива userIds
        await User.findOneAndUpdate({ _id: { $in: userIds } }, { $addToSet: { groups: group._id } });

        // Убираем группу у остальных
        await User.findOneAndUpdate(
            // Там где группа указана, хотя пользователя там быть не должно
            { $and: [{ groups: group._id }, { _id: { $nin: userIds } }] },
            // Убираем ID группы из массива групп
            { $pull: { groups: group._id } },
        );
    }
});

class GroupClass {
    /** Для получения своего списка групп */
    toIndexJSON(userId) {
        const role = this.users.find(i => i.user.toString() === userId.toString()).role;

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
