const { bot } = require("../bot");
const User = require("../../model/user");
const Category = require("../../model/categories");
const Product = require("../../model/product");
const { userKeyboard, adminKeyboard } = require("../menu/keyboard");
const { clear_draft_product } = require("../helper/product");

const get_all_categories = async (chatId, page = 1, message_id = null) => {
  clear_draft_product(); // chernovik mahsulotlarni o`chiradi
  let limit = 5; // limit(m) m tasinin ko`rsatadi
  let skip = (page - 1) * limit; //skip(n) metodi 100 malumotdan boshidagi n tasini o`tqazadi
  let user = await User.findOne({ chatId }).lean();
  let categories = await Category.find().skip(skip).limit(limit).lean();
  if (page == 1) {
    await User.findByIdAndUpdate(
      user._id,
      { ...user, action: "category-1" },
      { new: true }
    );
  }
  if (categories.length == 0 && skip > 0) {
    page--;
    await User.findByIdAndUpdate(
      user._id,
      { ...user, action: `category-${page}` },
      { new: true }
    );
    // console.log("page", page, user.action);
    get_all_categories(chatId, page);
    return;
  }

  let list = categories.map((category) => [
    {
      text: category.title,
      callback_data: `category_${category._id}`,
    },
  ]);
  const inline_keyboard = [
    ...list,
    [
      {
        text: "Ortga",
        callback_data: page > 1 ? "back_category" : page,
      },
      {
        text: page,
        callback_data: ".",
      },
      {
        text: "Keyingi",
        callback_data: limit == categories.length ? "next_category" : page,
      },
    ],
    user.admin
      ? [
          {
            text: "Yangi kategoriya",
            callback_data: "add_category",
          },
        ]
      : [],
  ];

  if (message_id > 0) {
    bot.editMessageReplyMarkup({inline_keyboard}, {chat_id: chatId, message_id})
  } else {
    bot.sendMessage(chatId, "Kategoriyalar ro`yxati", {
      reply_markup: {
        remove_keyboard: true, // pasdagi kinopkalarni o`chirish uchun
        inline_keyboard,
      },
    });
  }
};

const add_category = async (chatId) => {
  let user = await User.findOne({ chatId }).lean();

  if (user.admin) {
    await User.findByIdAndUpdate(
      user._id,
      {
        ...user,
        action: "add_category",
      },
      { new: true }
    );
    bot.sendMessage(chatId, "Yangi kategoriya nomini kiriting");
  } else {
    bot.sendMessage(chatId, "Siga bunday so`rov yuborish mumkin emas");
  }
};

const new_category = async (msg) => {
  const chatId = msg.from.id;
  const text = msg.text;

  let user = await User.findOne({ chatId }).lean();

  if (user.admin && user.action === "add_category") {
    let newCategory = new Category({
      title: text,
    });
    await newCategory.save();
    await User.findByIdAndUpdate(user._id, {
      ...user,
      action: "category",
    });
    get_all_categories(chatId);
  } else {
    bot.sendMessage(chatId, "Siga bunday so`rov yuborish mumkin emas");
  }
};

const pagination_category = async (chatId, action, message_id = null) => {
  let user = await User.findOne({ chatId }).lean();
  let page = 1;
  if (user.action.includes("category-")) {
    page = +user.action.split("-")[1]; // bu pageni aniqlaaydi

    if (action == "back_category" && page > 1) {
      page--;
    }
  }
  if (action == "next_category") {
    page++;
  }
  await User.findByIdAndUpdate(
    user._id,
    { ...user, action: `category-${page}` },
    { new: true }
  );
  get_all_categories(chatId, page, message_id);
};

const show_category = async (chatId, id, page = 1) => {
  let category = await Category.findById(id).lean();
  const user = await User.findOne({ chatId }).lean();
  await User.findByIdAndUpdate(
    user._id,
    { ...user, action: `category_${category._id}` },
    { new: true }
  );
  let limit = 5; // limit(m) m tasinin ko`rsatadi
  let skip = (page - 1) * limit; //skip(n) metodi 100 malumotdan boshidagi n tasini o`tqazadi
  let products = await Product.find({ category: category._id, status: 1 })
    .skip(skip)
    .limit(limit)
    .sort({ _id: -1 })
    .lean();
  let list = products.map((product) => [
    {
      text: product.title,
      callback_data: `product_${product._id}`,
    },
  ]);
  bot.sendMessage(chatId, `${category.title} turidagi mahsulotlar ro'yxati`, {
    reply_markup: {
      remove_keyboard: true, // pasdagi kinopkalarni o`chirish uchun
      inline_keyboard: [
        ...list,
        [
          {
            text: "Ortga",
            callback_data: page > 1 ? "back_product" : page,
          },
          {
            text: page,
            callback_data: ".",
          },
          {
            text: "Keyingi",
            callback_data: limit == products.length ? "next_product" : page,
          },
        ],
        user.admin
          ? [
              {
                text: "Yangi mahsulot",
                callback_data: `add_product-${category._id}`,
              },
            ]
          : [],
        user.admin
          ? [
              {
                text: "turkumni tahrirlash",
                callback_data: `edit_category-${category._id}`,
              },
              {
                text: "turkumni o`chirish",
                callback_data: `del_category-${category._id}`,
              },
            ]
          : [],
      ],
    },
  });
};

const remove_category = async (chatId, id) => {
  let user = await User.findOne({ chatId }).lean();
  let category = await Category.findById(id).lean();
  if (user.action !== "del_category") {
    await User.findByIdAndUpdate(
      user._id,
      {
        action: "del_category",
      },
      { new: true }
    );
    bot.sendMessage(
      chatId,
      `Siz ${category.title} turkumini o'chirmoqchimisiz?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Bekor qilish",
                callback_data: `category_${category._id}`,
              },
              {
                text: "Ha",
                callback_data: `del_category-${category._id}`,
              },
            ],
          ],
        },
      }
    );
  } else {
    let products = await Product.find({ category: category._id })
      .select(["_id"])
      .lean();

    await Promise.all(
      products.map(async (product) => {
        await Product.findByIdAndDelete();
      })
    );
    await Category.findByIdAndDelete(id);

    bot.sendMessage(
      chatId,
      `${category.title} turkumi o'chirildi
      menyudan tanlang`
    );
  }
};

const edit_category = async (chatId, id) => {
  let user = await User.findOne({ chatId }).lean();
  let category = await Category.findById(id).lean();
  await User.findByIdAndUpdate(
    user._id,
    { ...user, action: `edit_category-${id}` },
    { new: true }
  );

  bot.sendMessage(chatId, `${category.title} turkumihga nom bering`);
};

const save_category = async (chatId, title) => {
  let user = await User.findOne({ chatId }).lean();
  await User.findByIdAndUpdate(
    user._id,
    { ...user, action: "menu" },
    { new: true }
  );
  let id = user.action.split("-")[1];
  let category = await Category.findById(id).lean();
  await Category.findByIdAndUpdate(id, { ...category, title }, { new: true });
  bot.sendMessage(chatId, "Turkum yangilandi \n Menyudan tanlang");
};

module.exports = {
  get_all_categories,
  add_category,
  new_category,
  pagination_category,
  show_category,
  remove_category,
  edit_category,
  save_category,
};
