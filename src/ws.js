import socketIO from 'socket.io';
import jwt from 'jsonwebtoken';
import { secret } from './config';

class WS {
    clients = [];

    init(app) {
        this.io = socketIO(app);

        this.io.on('connection', socket => {
            const client = {
                socket,
            };

            socket.on('auth', ({ token }) => {
                try {
                    token = token.replace('JWT ', '');
                    const payload = jwt.verify(token, secret);
                    client.userId = payload.id;
                } catch (e) {
                    console.warn(e);
                    // TODO кикать пользовталея
                }
            });

            this.clients.push(client);
            console.log('>>>>> Socket.IO: a user connected');
        });

        this.io.on('disconnect', socket => {
            const i = this.clients.findIndex(client => client.socket === socket);
            if (i > -1) {
                this.clients.splice(i, 1);
            }
            console.log('>>>>> Socket.IO: a user disconnected');
        });
    }

    /**
     * Определить подключенных клиентов причастных к заметке
     * @param note
     */
    async getClientsNoteInvolved(note) {
        // Определяем юзеров которые имеют отношение к этой заметке
        const userIds = await note.getInvolvedUserIds();

        const results = [];
        for (const client of this.clients) {
            if (client.userId && userIds.includes(client.userId)) {
                results.push(client);
            }
        }
        return results;
    }

    /**
     * Уведомить об обновлении заметки
     * @param note
     */
    async notifyNoteUpdate(note) {
        for (const client of await this.getClientsNoteInvolved(note)) {
            client.socket.emit('note:updated', { note: note.toIndexJSON() });
        }
    }
}

export default new WS();
