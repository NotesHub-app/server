import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import { secret } from '../config';
import { randomString } from '../utils/string';

const mongoSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            lowercase: true,
            unique: true,
            required: [true, "can't be blank"],
            match: [/\S+@\S+\.\S+/, 'is invalid'],
            index: true,
        },
        password: String,
        registration: {
            verified: Boolean,
            code: String,
        },
        groups: [
            {
                group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
                role: {
                    type: Number,
                    required: true,
                },
            },
        ],
        restorePasswordCodes: [
            {
                code: {
                    type: String,
                    required: true,
                },
                codeExpire: {
                    type: Date,
                    required: true,
                },
            },
        ],
    },
    { timestamps: true },
);

mongoSchema.plugin(uniqueValidator, { message: 'is already taken.' });

mongoSchema.pre('save', async function() {
    const user = this;

    // При сохранении хешировать пароль
    if (!user.isModified('password')) {
        return;
    }
    const SALT_FACTOR = 10;

    const salt = await bcrypt.genSalt(SALT_FACTOR);
    user.password = await bcrypt.hash(user.password, salt);
});

class UserClass {
    get groupIds() {
        return this.groups.map(groupItem => groupItem.group._id.toString());
    }

    async comparePassword(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    }

    generateJWT() {
        return jwt.sign(
            {
                id: this._id,
            },
            secret,
            { expiresIn: 60 * 60 * 10 }, // 10min
        );
    }

    generateRestorePasswordCode() {
        const user = this;

        user.restorePasswordCodes.push({
            code: randomString(20),
            codeExpire: dayjs().add(1, 'hour'),
        });
    }

    toAuthJSON() {
        return {
            email: this.email,
            token: `JWT ${this.generateJWT()}`,
        };
    }
}

mongoSchema.loadClass(UserClass);

const User = mongoose.model('User', mongoSchema);

export default User;
