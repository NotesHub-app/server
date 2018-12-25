import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { randomString } from '../utils/string';
import ws from '../ws';

const mongoSchema = new mongoose.Schema(
    {
        // Название группы (заголовок)
        title: {
            type: String,
            required: true,
        },

        // Инвайт-коды для присоединения к группе
        inviteCodes: [
            {
                // Случайная строка
                code: {
                    type: String,
                    required: true,
                },

                // Время когда код перестанет действовать
                expireDate: {
                    type: Date,
                    required: true,
                },

                // Кто сгенерировал код
                author: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },

                // Роль которая будет присвоена вступившему в группу по этому коду
                role: Number,
            },
        ],
    },
    { timestamps: true },
);

class GroupClass {
    /** Уведомить об обновлении группы по ws */
    async notifyUpdate(wsClientId) {
        const group = this;
        await ws.notifyGroupUpdate(group, await group.getUsers(), wsClientId);
    }

    /** Уведомить об удалении группы по ws */
    async notifyRemove(wsClientId) {
        const group = this;
        ws.notifyGroupRemove(group._id.toString(), await group.getUserIds(), wsClientId);
    }

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
        role = role || 2; // По умолчанию роль чтение (2) и никогда админ (0)

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
        // Получение роли пользователя в этой группе
        const { role } = user.groups.find(i => i.group._id.toString() === this._id.toString());

        return {
            id: this._id,
            title: this.title,
            myRole: role,
            updatedAt: this.updatedAt.getTime(),
        };
    }

    /** Получить списко пользователей группы */
    async getUsers() {
        const group = this;

        return await this.model('User').find({ groups: { $elemMatch: { group } } });
    }

    /** Получить список только ID пользователей группы */
    async getUserIds() {
        const users = await this.getUsers();
        return users.map(i => i._id.toString());
    }

    /**
     * Вывод для отображения в настройках группы
     * @returns {{myRole, id, title, users: Array}}
     */
    async toViewJSON(user) {
        const groupUsers = await this.getUsers();

        const resultUsers = [];
        groupUsers.forEach(groupUser => {
            const { role } = groupUser.groups.find(i => i.group.toString() === this._id.toString());
            const resultUser = {
                ...groupUser.toIndexJSON(),
                role,
            };
            resultUsers.push(resultUser);
        });

        return {
            ...this.toIndexJSON(user),
            users: resultUsers,
        };
    }
}

mongoSchema.loadClass(GroupClass);

const Group = mongoose.model('Group', mongoSchema);

export default Group;
