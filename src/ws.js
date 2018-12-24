import socketIO from 'socket.io';
import jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { SECRET } from './config';

class WS {
    clients = [];

    init(app) {
        this.io = socketIO(app);

        // Middleware
        this.io.use((socket, next) => {
            let { token } = socket.handshake.query;

            try {
                token = token.replace('JWT ', '');
                socket.payload = jwt.verify(token, SECRET);

                return next();
            } catch (e) {
                return next(new Error('authentication error'));
            }
        });

        this.io.on('connection', socket => {
            const { clientId } = socket.handshake.query;

            const clientObj = {
                id: clientId,
                socket,
                userId: socket.payload.id,
                subscribedNoteId: null,
            };

            // Кладем инфу по клиенту в общий массив клиентов
            this.clients.push(clientObj);

            // При подписки на получение детальных данных по заметке
            socket.on('note:subscribe', ({ noteId }) => {
                clientObj.subscribedNoteId = noteId;
            });

            // При дисконекте
            socket.on('disconnect', () => {
                // Удаляем из массива клиентов
                this.clients = this.clients.filter(i => i !== clientObj);
            });
        });
    }

    /**
     * Получить клиентов по массиву ID пользователей
     * @param userIds
     * @returns {Array}
     */
    getClientsByUserIds(userIds) {
        const results = [];
        for (const client of this.clients) {
            if (client.userId && userIds.includes(client.userId)) {
                results.push(client);
            }
        }
        return results;
    }

    /**
     * Отправить данные клиентам
     * @param userIds
     * @param skipClientId
     * @param command
     * @param data
     */
    send({ userIds, skipClientId, command, data }) {
        const clients = this.getClientsByUserIds(userIds).filter(client => client.id !== skipClientId);
        for (const client of clients) {
            if (_.isFunction(data)) {
                data = data({ client });
            }
            client.socket.emit(command, data);
        }
    }

    /**
     * Уведомить об обновлении/создании заметки
     * @param note
     * @param userIds
     * @param skipClientId
     */
    notifyNoteUpdate(note, userIds, skipClientId) {
        this.send({
            command: 'note:updated',
            data: ({ client }) => {
                if (client.subscribedNoteId === note._id.toString()) {
                    return { noteId: note._id, notePatch: note.toPatchJSON(), isPatch: true };
                }
                return { note: note.toIndexJSON() };
            },
            userIds,
            skipClientId,
        });
    }

    /**
     * Уведомить о...
     * @param note
     * @param file
     * @param userIds
     * @param skipClientId
     */
    notifyNoteFileUpdate(note, file, userIds, skipClientId) {
        this.send({
            command: 'note:fileUpdated',
            data: { noteId: note._id, file: file.toIndexJSON() },
            userIds,
            skipClientId,
        });
    }

    /**
     * Уведомить о...
     * @param note
     * @param fileId
     * @param userIds
     * @param skipClientId
     */
    notifyNoteFileRemove(note, fileId, userIds, skipClientId) {
        this.send({
            command: 'note:fileRemoved',
            data: { noteId: note._id, fileId },
            userIds,
            skipClientId,
        });
    }

    /**
     * Уведомить об удалении заметок
     * @param noteId
     * @param userIds
     * @param skipClientId
     */
    notifyNoteRemove(noteId, userIds, skipClientId) {
        this.send({
            command: 'note:removed',
            data: { noteId },
            userIds,
            skipClientId,
        });
    }

    /**
     * Уведомить об обновлении/создании группы
     * @param group
     * @param users
     * @param skipClientId
     */
    async notifyGroupUpdate(group, users, skipClientId) {
        const userIds = users.map(user => user._id.toString());
        const usersMap = {};
        users.forEach(user => {
            usersMap[user._id.toString()] = user;
        });

        this.send({
            command: 'group:updated',
            data: ({ client }) => ({ group: group.toIndexJSON(usersMap[client.userId]) }),
            userIds,
            skipClientId,
        });
    }

    /**
     * Уведомить об удалении группы
     * @param groupId
     * @param userIds
     * @param skipClientId
     */
    notifyGroupRemove(groupId, userIds, skipClientId) {
        this.send({
            command: 'group:removed',
            data: { groupId },
            userIds,
            skipClientId,
        });
    }
}

export default new WS();
