import mongoose from 'mongoose';

const mongoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

class GroupClass {
    /** Для получения своего списка групп */
    toIndexJSON(user) {
        const { role } = user.groups.find(i => i.group._id.toString() === this._id.toString());

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
