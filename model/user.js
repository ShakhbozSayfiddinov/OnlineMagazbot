const {Schema, model} = require('mongoose');
const { type } = require('os');
const User = new Schema({
    name: String,
    chatId: Number,
    phone: String,
    admin: {
        type: Boolean,
        default: false
    },
    action: String,   //foydalanuvchi qaysi darajaga kelganini aniqlandi
    status: {
        type:Boolean,
        default: true
    },
    createAt: Date
});

module.exports = model('User', User);