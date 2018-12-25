import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import { SECRET } from '../config';
import { randomString } from '../utils/string';

const mongoSchema = new mongoose.Schema(
    {
        // Email пользователя
        email: {
            type: String,
            lowercase: true,
            index: true,
        },

        // Имя пользователя
        userName: {
            type: String,
        },

        // Хеш пароля
        password: String,

        // Объект верификации регистрации
        registration: {
            // Пользователь верифицирован
            verified: Boolean,

            // Код верификации (отправляется на почту)
            code: String,
        },

        // Группы пользователя
        groups: [
            {
                // Группа
                group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },

                // Роль в группе (0-админ, 1-редактор, 2-только просмотр)
                role: {
                    type: Number,
                    required: true,
                },
            },
        ],

        // Коды восстановления пароля
        restorePasswordCodes: [
            {
                // Сам код
                code: {
                    type: String,
                    required: true,
                },

                // Время истечения срока действия кода
                codeExpire: {
                    type: Date,
                    required: true,
                },
            },
        ],

        // Код для рефреш-токена (обновляется каждый раз при обновлении токена)
        refreshTokenCode: String,

        // Настройки UI пользователя
        uiSettings: Object, // TODO определить фиксированные поля

        // Если пользователь вошел через Github
        githubId: Number, // ID в системе гитхаба
        githubInfo: Object, // Параметры пользотвателя отданные гитхабом

        // Если пользователь вошел через Google
        googleId: Number, // ID в системе гугла
        googleInfo: Object, // Параметры пользователя отданные гуглом
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
            SECRET,
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

    /** Форма пользователя для отображения в списках */
    toIndexJSON() {
        const resultUser = {
            id: this._id,
            userName: this.userName,
        };
        if (this.email) {
            resultUser.email = this.email;
        }
        if (this.githubId) {
            resultUser.githubUrl = this.githubInfo.url;
        }
        if (this.googleId) {
            resultUser.googleUrl = this.googleInfo.url;
        }

        return resultUser;
    }
}

mongoSchema.loadClass(UserClass);

const User = mongoose.model('User', mongoSchema);

export default User;
