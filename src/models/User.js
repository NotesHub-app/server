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
            index: true,
        },
        userName: {
            type: String,
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

        githubId: Number,
        githubInfo: Object,

        googleId: Number,
        googleInfo: Object,
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

    /**
     * Сверка пароля с криптованным
     * @param candidatePassword
     */
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
            { expiresIn },
        );
    }

    /** Генерация кода восстановления пароля */
    generateRestorePasswordCode() {
        const user = this;

        user.restorePasswordCodes.push({
            code: randomString(20),
            codeExpire: dayjs().add(1, 'hour'),
        });
    }

    /** Генерация кода для рефреш-токена */
    generateRefreshTokenCode() {
        this.refreshTokenCode = randomString(10);
    }

    /**
     * Обноалвение настроек UI (merge-ом)
     * @param uiSettings
     */
    updateUiSetting(uiSettings) {
        const resultSettings = { ...this.uiSettings };
        for (const [param, value] of Object.entries(uiSettings)) {
            resultSettings[param] = value;
        }
        this.uiSettings = resultSettings;
    }

    /** Сгернерировать ответ для авторизации */
    toAuthJSON() {
        return {
            id: this._id,
            email: this.email,
            userName: this.userName,
            token: `JWT ${this.generateJWT()}`,
            fileToken: this.generateJWT({
                type: 'file',
                expiresIn: 86400 * 7, // 7 дней
            }),
            refreshToken: `JWT ${this.generateJWT({
                type: 'refresh',
                expiresIn: 86400 * 90, // 3 месяца
                additionalData: { code: this.refreshTokenCode },
            })}`,
        };
    }

    /** Сгернерировать ответ для получние полного объекта пользователя */
    toFullUserJSON() {
        return {
            ...this.toAuthJSON(),
            uiSettings: this.uiSettings || {},
        };
    }
}

mongoSchema.loadClass(UserClass);

const User = mongoose.model('User', mongoSchema);

export default User;
