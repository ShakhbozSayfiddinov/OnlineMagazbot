const { bot } = require("./bot");
const { start, requestContact } = require("./helper/start");
const User = require("../model/user");
const { get_all_users } = require("./helper/users");
const {
  get_all_categories,
  new_category,
  save_category,
} = require("./helper/category");
const { add_poduct_next } = require("../bot/helper/product");
bot.on("message", async (msg) => {
  const chatId = msg.from.id;
  const text = msg.text;
  const user = await User.findOne({ chatId }).lean();
   console.log(text);
  if (text === "/start") {
    start(msg);
  }

  if (user) {
    if (user.action === "request_contact" && !user.phone) requestContact(msg);

    if (text === "Foydalanuvchilar") {
      get_all_users(msg);
      return;
    }
    if (text === "Katalog") {
      get_all_categories(chatId);
      return;
    }
    if (user.action === "add_category") new_category(msg);
    if (user.action.includes("edit_category-")) {
      save_category(chatId, text);
    }

    if (
      user.action.includes("new_product_") &&
      user.action !== "new_product_img"
    ) {
      add_poduct_next(chatId, text, user.action.split("_")[2]);
    }

    if (user.action == "new_product_img") {
      if (msg.photo) {
        add_poduct_next(chatId, msg.photo.at(-1).file_id, "img");

        // at metodi massivga nisbatan oxirgisini olib beradi
      } else {
        bot.sendMessage(
          chatId,
          "Mahsulot rasmini fayl ko`rinishida emas, rasm ko`rinishida yuklang"
        );
      }
    }
  }
});
