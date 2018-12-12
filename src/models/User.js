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
        refreshTokenCode: String,
    },
    { timestamps: true }
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

    /**
     * Генерация JWT токена
     * @param type - тип токена
     * @param expiresIn - в секундах
     * @param additionalData
     * @returns {*}
     */
    generateJWT({ type, expiresIn, additionalData } = {}) {
        type = type || 'auth';
        //expiresIn = expiresIn || 300;
        expiresIn = expiresIn || 30;
        additionalData = additionalData || {};

        return jwt.sign(
            {
                id: this._id,
                type,
                ...additionalData,
            },
            secret,
            { expiresIn } // 10min
        );
    }

    /**
     * Генерация кода восстановления пароля
     */
    generateRestorePasswordCode() {
        const user = this;

        user.restorePasswordCodes.push({
            code: randomString(20),
            codeExpire: dayjs().add(1, 'hour'),
        });
    }

    /**
     * Сгернерировать ответ для авторизации
     * @param remember - делать refresh-токен долгоживущим
     * @returns {{fileToken: *, email: *, token: string, refreshToken: string}}
     */
    toAuthJSON(remember) {
        return {
            email: this.email,
            token: `JWT ${this.generateJWT()}`,
            fileToken: this.generateJWT({ type: 'file' }),
            refreshToken: `JWT ${this.generateJWT({
                type: 'refresh',
                // expiresIn: remember ? 604800 : 600, // 7 дней или 10 минут
                expiresIn: 604800, // 7 дней или 10 минут
                additionalData: { code: this.refreshTokenCode },
            })}`,
        };
    }
}

mongoSchema.loadClass(UserClass);

const User = mongoose.model('User', mongoSchema);

export default User;
