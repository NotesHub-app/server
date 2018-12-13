import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import { secret } from '../config';
import { randomString } from '../utils/string';
import * as _ from 'lodash';

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
        uiSettings: Object, // TODO определить фиксированные поля
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
    generateJWT({ type = 'auth', expiresIn = 300, additionalData = {} } = {}) {
        return jwt.sign(
            {
                id: this._id,
                type,
                ...additionalData,
            },
            secret,
            { expiresIn }
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

    generateRefreshTokenCode() {
        this.refreshTokenCode = randomString(10);
    }

    /**
     * Сгернерировать ответ для авторизации
     * @returns {{fileToken: *, email: *, token: string, refreshToken: string}}
     */
    toAuthJSON() {
        return {
            email: this.email,
            token: `JWT ${this.generateJWT()}`,
            fileToken: this.generateJWT({ type: 'file' }),
            refreshToken: `JWT ${this.generateJWT({
                type: 'refresh',
                expiresIn: 86400 * 90, // 3 месяца
                additionalData: { code: this.refreshTokenCode },
            })}`,
        };
    }

    updateUiSetting(uiSettings) {
        const resultSettings = { ...this.uiSettings };
        for (const [param, value] of Object.entries(uiSettings)) {
            resultSettings[param] = value;
        }
        this.uiSettings = resultSettings;
    }

    /**
     * Сгернерировать ответ для получние полного объекта пользователя
     * @returns {{fileToken: *, email: *, token: string, refreshToken: string}}
     */
    toFullUserJSON() {
        return {
            ...this.toAuthJSON(),
            uiSettings: this.uiSettings,
        };
    }
}

mongoSchema.loadClass(UserClass);

const User = mongoose.model('User', mongoSchema);

export default User;
