import socketIO from 'socket.io';
import jwt from 'jsonwebtoken';
import { secret } from './config';

class WS {
    clients = [];

    init(app) {
        this.io = socketIO(app);

        // middleware
        this.io.use((socket, next) => {
            let { token } = socket.handshake.query;

            try {
                token = token.replace('JWT ', '');
                socket.payload = jwt.verify(token, secret);

                return next();
            } catch (e) {
                return next(new Error('authentication error'));
            }
        });

        this.io.on('connection', socket => {
            const client = {
                socket,
                userId: socket.payload.id,
            };

            this.clients.push(client);
        });

        this.io.on('disconnect', socket => {
            const i = this.clients.findIndex(client => client.socket === socket);
            if (i > -1) {
                this.clients.splice(i, 1);
            }
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
     * Уведомить об обновлении/создании заметки
     * @param note
     * @param userIds
     */
    notifyNoteUpdate(note, userIds) {
        for (const client of this.getClientsByUserIds(userIds)) {
            client.socket.emit('note:updated', { note: note.toIndexJSON() });
        }
    }

    /**
     * Уведомить о...
     * @param note
     * @param file
     * @param userIds
     */
    notifyNoteFileUpdate(note, file, userIds) {
        for (const client of this.getClientsByUserIds(userIds)) {
            client.socket.emit('note:fileUpdated', { noteId: note._id, file: file.toIndexJSON() });
        }
    }

    /**
     * Уведомить о...
     * @param note
     * @param fileId
     * @param userIds
     */
    notifyNoteFileRemove(note, fileId, userIds) {
        for (const client of this.getClientsByUserIds(userIds)) {
            client.socket.emit('note:fileRemoved', { noteId: note._id, fileId });
        }
    }

    /**
     * Уведомить об удалении заметок
     * @param noteId
     * @param userIds
     */
    notifyNoteRemove(noteId, userIds) {
        for (const client of this.getClientsByUserIds(userIds)) {
            client.socket.emit('note:removed', { noteId });
        }
    }

    /**
     * Уведомить об обновлении/создании группы
     * @param group
     * @param users
     */
    async notifyGroupUpdate(group, users) {
        const userIds = users.map(user => user._id.toString());
        const usersMap = {};
        users.forEach(user => {
            usersMap[user._id.toString()] = user;
        });

        for (const client of this.getClientsByUserIds(userIds)) {
            client.socket.emit('group:updated', { group: group.toIndexJSON(usersMap[client.userId]) });
        }
    }

    /**
     * Уведомить об удалении группы
     * @param groupId
     * @param userIds
     */
    notifyGroupRemove(groupId, userIds) {
        for (const client of this.getClientsByUserIds(userIds)) {
            client.socket.emit('group:removed', { groupId });
        }
    }
}

export default new WS();
