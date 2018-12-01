import mongoose from 'mongoose';
import DiffMatchPatch from 'diff-match-patch';
import * as _ from 'lodash';

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
            required: true,
            keepHistory: true,
            set: previousKeeper('title'),
        },
        icon: {
            type: String,
            required: true,
            keepHistory: true,
            set: previousKeeper('icon'),
        },
        iconColor: {
            type: String,
            required: true,
            keepHistory: true,
            set: previousKeeper('iconColor'),
        },
        content: {
            type: String,
            required: true,
            keepHistory: true,
            set: previousKeeper('content'),
        },
        parent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
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
    { timestamps: true },
);

class NoteClass {
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
     * Проверка возможности делать правки/удаление
     * @param user
     * @returns {boolean}
     */
    checkAllowToEdit(user) {
        const note = this;
        if (note.group) {
            const userGroup = user.groups.find(i => i._id.toString() === note.group._id.toString());
            if (userGroup.role > 1) {
                return false;
            }
        } else if (note.owner) {
            if (note.owner._id.toString() !== user._id.toString()) {
                return false;
            }
        }
        return true;
    }

    /** Вывод для общего списка заметок в дереве */
    toIndexJSON() {
        return {
            id: this._id,
            title: this.title,
            icon: this.icon,
            iconColor: this.iconColor,
            ownerId: this.owner,
            groupIp: this.group,
            parentId: this.parent,
        };
    }

    /** Вывод для отображения заметки с содержимым */
    toViewJSON() {
        return {
            id: this._id,
            title: this.title,
            icon: this.icon,
            iconColor: this.iconColor,
            ownerId: this.owner,
            content: this.content,
        };
    }
}

mongoSchema.loadClass(NoteClass);

const Note = mongoose.model('Note', mongoSchema);

export default Note;
