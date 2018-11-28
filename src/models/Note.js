import mongoose from 'mongoose';

const mongoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            required: true,
        },
        iconColor: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
        history: {
            type: [],
            required: true,
        },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    },
    { timestamps: true },
);

class NoteClass {
    /** Вывод для общего списка заметок в дереве */
    toIndexJSON() {
        return {
            id: this._id,
            title: this.title,
            icon: this.icon,
            iconColor: this.iconColor,
            ownerId: this.owner,
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
