import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { randomString } from '../utils/string';

const mongoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        inviteCodes: [
            {
                code: {
                    type: String,
                    required: true,
                },
                expireDate: {
                    type: Date,
                    required: true,
                },
                author: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: Number,
            },
        ],
    },
    { timestamps: true },
);

class GroupClass {
    /**
     * Проверка возможности делать правки/удаление
     * @param user
     * @returns {boolean}
     */
    checkAllowToEdit(user) {
        const group = this;
        // Автор запроса должен быть админом группы
        return user.groups.some(i => i.group._id.toString() === group._id.toString() && i.role === 0);
    }

    /**
     * Сгенерировать инвайт-код
     * @param user
     * @param role
     */
    generateInviteCode({ user, role }) {
        const group = this;
        role = role || 2; // По умолчанию роль чтение и никогда админ

        const codeObj = {
            code: randomString(20),
            expireDate: dayjs().add(1, 'hour'),
            role,
            author: user,
        };

        group.inviteCodes.push(codeObj);

        return codeObj;
    }

    /**
     * Получение своего списка групп
     * @param user
     */
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
