import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { secret } from '../config';

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
            codeExpire: Date,
        },
        groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    },
    { timestamps: true }
);

mongoSchema.plugin(uniqueValidator, { message: 'is already taken.' });

//При сохранении хешировать пароль
mongoSchema.pre('save', async function() {
    const user = this;
    const SALT_FACTOR = 10;

    if (!user.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(SALT_FACTOR);
    user.password = await bcrypt.hash(user.password, salt);
});

class UserClass {
    async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    }

    generateJWT() {
        return jwt.sign(
            {
                id: this._id,
            },
            secret,
            { expiresIn: 60 * 60 }
        );
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
