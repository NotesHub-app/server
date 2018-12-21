import mongoose from 'mongoose';
import DiffMatchPatch from 'diff-match-patch';
import * as _ from 'lodash';
import ws from '../ws';

/**
 * Сохраняет предудущее состояние поля
 * @param field - имя поля
 */
const previousKeeper = field =>
    function(value) {
        this._previous = this._previous || [];
        this._previous[field] = this[field];
        return value;
    };

const mongoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            keepHistory: true,
            set: previousKeeper('title'),
        },
        icon: {
            type: String,
            keepHistory: true,
            set: previousKeeper('icon'),
        },
        iconColor: {
            type: String,
            keepHistory: true,
            set: previousKeeper('iconColor'),
        },
        content: {
            type: String,
            keepHistory: true,
            set: previousKeeper('content'),
        },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
        files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
        history: [
            {
                changes: [
                    {
                        field: String,
                        diff: Object,
                    },
                ],
                author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                dateTime: Date,
            },
        ],
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    },
    { timestamps: true }
);

mongoSchema.pre('remove', async function() {
    const note = this;

    // Удаляем все файлы заметки
    await note.populate('files').execPopulate();
    for (const file of note.files) {
        await file.remove();
    }
});

class NoteClass {
    /**
     * Уведомить об создании/обновлении заметки
     * @param wsClientId
     */
    async notifyUpdate(wsClientId) {
        const note = this;
        ws.notifyNoteUpdate(note, await note.getInvolvedUserIds(), wsClientId);
    }

    /**
     * Уведомить об создании/обновлении файла заметки
     * @param file
     * @param wsClientId
     * @returns {Promise<void>}
     */
    async notifyFileUpdate(file, wsClientId) {
        const note = this;
        ws.notifyNoteFileUpdate(note, file, await note.getInvolvedUserIds(), wsClientId);
    }

    /**
     * Уведомить об удалении файла заметки
     * @param fileId
     * @param wsClientId
     * @returns {Promise<void>}
     */
    async notifyFileRemove(fileId, wsClientId) {
        const note = this;
        ws.notifyNoteFileRemove(note, fileId, await note.getInvolvedUserIds(), wsClientId);
    }

    /**
     * Уведомить об удалении заметки
     * @param wsClientId
     */
    async notifyRemove(wsClientId) {
        const note = this;
        ws.notifyNoteRemove(note._id.toString(), await note.getInvolvedUserIds(), wsClientId);
    }

    /**
     * Query-helper для получения заметки с проверкой принадлежности пользователя к ней
     * @param noteId
     * @param user
     * @returns {*}
     */
    static findUserNote(noteId, user) {
        return this.findOne({
            $and: [
                { _id: noteId },
                {
                    $or: [
                        // Владельцем должен быть пользователь
                        { owner: user },
                        // Или группа в которой он состоит
                        { group: { $in: user.groupIds } },
                    ],
                },
            ],
        });
    }

    /**
     * Сгенерировать историю правок сделанных пользователем
     * @param user
     */
    generateHistory(user) {
        const note = this;

        const historyItem = { changes: [] };
        let somethingModified = false;
        _.each(mongoSchema.obj, (options, field) => {
            // Для полей которых keepHistory
            if (options.keepHistory) {
                // Если была модификация содержимого
                if (note.isModified(field)) {
                    somethingModified = true;

                    // Сохраняем в базе diff объект разницы
                    const dmp = new DiffMatchPatch();
                    historyItem.changes.push({
                        field,
                        diff: dmp.diff_main(note[field], note._previous[field]),
                    });
                }
            }
        });

        // Только если были реальные правки
        if (somethingModified) {
            historyItem.author = user;
            historyItem.dateTime = new Date();
            note.history.push(historyItem);
        }
    }

    /**
     * Получения массива ID-ов всех вложенных дочерних заметок
     * @param note
     * @returns {Promise<*>}
     */
    static async getChildrenIdsOf(note) {
        const result = await this.aggregate([
            {
                $graphLookup: {
                    from: 'notes',
                    startWith: note._id,
                    connectFromField: '_id',
                    connectToField: 'parent',
                    as: 'children',
                },
            },
            {
                $project: {
                    _id: 1,
                    children: 1,
                },
            },
        ]);

        return result[0].children.map(item => item._id);
    }

    /**
     * Проверка возможности делать правки/удаление
     * @param user
     * @returns {boolean}
     */
    checkAllowToEdit(user) {
        const note = this;
        if (note.group) {
            const userGroup = user.groups.find(i => i.group._id.toString() === note.group._id.toString());
            if (!userGroup || userGroup.role > 1) {
                return false;
            }
        } else if (note.owner) {
            if (note.owner._id.toString() !== user._id.toString()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Получить массив ID-ов причастных к заметке пользователей
     * @returns {Promise<*>}
     */
    async getInvolvedUserIds() {
        const note = this;

        if (note.group) {
            const group = await this.model('Group').findById(note.group);
            const users = await group.getUsers();
            return users.map(i => i._id.toString());
        }

        if (note.owner) {
            return [note.owner._id.toString()];
        }

        return [];
    }

    /** Вывод для общего списка заметок в дереве */
    toIndexJSON() {
        return {
            id: this._id,
            title: this.title,
            icon: this.icon,
            iconColor: this.iconColor,
            ownerId: this.owner,
            groupId: this.group,
            parentId: this.parent,
            updatedAt: this.updatedAt.getTime(),
        };
    }

    /** Вывод для отображения заметки с содержимым */
    toViewJSON() {
        return {
            ...this.toIndexJSON(),
            content: this.content,
            files: this.files.map(file => file.toIndexJSON()),
        };
    }
}

mongoSchema.loadClass(NoteClass);

const Note = mongoose.model('Note', mongoSchema);

export default Note;
