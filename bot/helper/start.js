const { bot } = require("../bot");
const User = require("../../model/user");
const {userKeyboard, adminKeyboard} =  require('../menu/keyboard')

const start = async (msg) => {
  const chatId = msg.from.id;

  let checkUser = await User.findOne({ chatId }).lean();
  //foydalanuvchi bo`lmasa uning raqamini olishni yozamiz.
  if (!checkUser) {
    let newUser = new User({
      name: msg.from.first_name,
      chatId,
      admin: false,
      status: true,
      createAt: new Date(),
      action: "request_contact",
    });
    await newUser.save();
    bot.sendMessage(
      chatId,
      `Assalomu alaykum hurmatli ${msg.from.first_name}. Iltimos telefon raqamingizni kiriting. `,
      {
        reply_markup: {
          // pasda tugma hosil qilish
          keyboard: [
            [
              {
                text: "Telefon raqamni yuborish",
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
        },
      }
    );
  } else {
    await User.findByIdAndUpdate(checkUser._id, {
      ...checkUser,
      action: 'menu'
      },
      {new: true}
  )
  bot.sendMessage(chatId,
    `Menyuni tanlang, ${checkUser.admin ? "Admin" : checkUser.name}`,
    {
      reply_markup: {
        keyboard: checkUser.admin ? adminKeyboard: userKeyboard,
        resize_keyboard: true // ixtiyoriy: klaviatura hajmini moslashtirish uchun
      },
    })
  }
 
};

// foydalanuvchi bo`lsayu phone bo`lmagan holdagi funksiya
const requestContact = async (msg) => {
  const chatId = msg.from.id;
  if (msg.contact.phone_number) {
    console.log(msg.contact.phone_number);
    let user = await User.findOne({ chatId }).lean();
    user.phone = msg.contact.phone_number;
    user.admin = msg.contact.phone_number === "+998997476017";
    console.log(user.admin.first_name);
    user.action = "menu";
    //malumotni update qilishimiz kerak
    await User.findByIdAndUpdate(user._id, user, { new: true });
    //endi unga xabar yuborsak bo`ladi
    bot.sendMessage(
      chatId,
      `Menyuni tanlang, ${user.admin ? "Admin" : user.name}`,
      {
        reply_markup: {
          keyboard: user.admin ? adminKeyboard: userKeyboard,
          resize_keyboard: true // ixtiyoriy: klaviatura hajmini moslashtirish uchun
        },
      }
    );
  }
};

module.exports = {
  start,
  requestContact,
};
