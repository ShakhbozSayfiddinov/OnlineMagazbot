const {bot} = require('../bot');
const User = require('../../model/user')
const {userKeyboard, adminKeyboard} = require('../menu/keyboard');

const get_all_users = async (msg) => {
    const chatId = msg.from.id
    let user = await User.findOne({chatId}).lean();
    // admini true bo`lganlarga ruxsat kodini yozamiz
    if(user.admin) {
        let users =  await User.find().lean();
        let list = '';
        users.forEach(user => {
            list += `${user.name}: ${chatId}\n`;
        })
        console.log(users);
        bot.sendMessage(chatId, `Foydalanuvchilar ro'yxati: 
${list}
            `)        
    }else{
        bot.sendMessage(chatId,' Sizga bunday so`rov mumkin emas', {
            reply_markup: {
                keyboard: userKeyboard,
                resize_keyboard: true
            }
            
        })
        

    }
}

module.exports = { 
    get_all_users
}