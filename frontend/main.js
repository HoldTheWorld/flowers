import { Telegraf, Markup  } from 'telegraf';
import * as dotenv from 'dotenv';
import { addUser, addFlower, getUserId } from "./requests.js";

dotenv.config();
const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);

class Plant {
  constructor() {
  }

  addName(name) {
    this.name = name
  }

  addFrequensy(frequensy) {
    this.frequensy = frequensy
  }

  waterPlant() {
    
  }

  updateFrequency() {

  }

  checkState() {

  }

  mutePlant() {

  }

  deletePlant() {

  }

  addPlant() {

  }

}

class User {
  constructor(name) {
    this.name = name

  }

  setUserId(id) {
    this.id = id
  }

  getPlants() {

  }

  removeAllPlants() {

  }
}

const presetNewPlant = 'Введите название растения и частоту полива в днях (через пробел)'

function yesNoKeyboard() {
  return Markup.inlineKeyboard([
      Markup.button.callback('Да', 'yes'),
      Markup.button.callback('Нет', 'no')
  ])
}

const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Добавить цветок', 'addPlant')],
  [Markup.button.callback('Полить цветок', 'waterPlant')],
  [Markup.button.callback('Изменить частоту полива', 'updateFrequency')],
  [Markup.button.callback('Посмотреть список цветов', 'getPlants')],
  [Markup.button.callback('Отключить напоминания', 'mutePlant')],
]).resize();

//https://github.com/znezniV/iad-telegram-plantbot
//https://github.com/telegraf/telegraf/issues/705
// Используйте session middleware


bot.action(['yes', 'no'], ctx => {
  if (ctx.callbackQuery.data === 'yes') {
      // addTask(ctx.session.taskText)
      // ctx.editMessageText('Ваша задача успешно добавлена')
  } else {
      ctx.deleteMessage()
  }
})

bot.start(async (ctx) => {

    const result = await addUser(ctx.message.from.username)

    if (result) {
      ctx.reply(`Добро пожаловать, ${ctx.message.from.username}!`, mainKeyboard);
    } else {
      ctx.reply(`Ошибка. Пожалуйста, попробуйте позднее.`);
    }
});

// bot.use((ctx, next) => {
//   console.log('enter middleware');
//   ctx.state.stage = 'testStage'
//   next()
// })


// Обработчик для добавления цветка
bot.action('addPlant', async (ctx, next) => {
  
  const user_id = await getUserId(ctx.update.callback_query.from.username);
  if (user_id > 0) {
    await ctx.replyWithHTML(presetNewPlant, {
      reply_markup: {
          force_reply: true,
      },
    });
  } else {
    ctx.reply('Ошибка пользователя');
  }
});

bot.on('text', async (ctx) => {
  // Проверяем, есть ли информация об исходном сообщении
  if (ctx.message.reply_to_message) {
      const repliedText = ctx.message.reply_to_message.text;
      switch (repliedText) {
        case presetNewPlant:
          const newPlant = {
            name: ctx.message.text.split(' ')[0],
            watering_frequency: ctx.message.text.split(' ')[1]
          }
          let msg = `Вы хотите добавить растение  ${newPlant.name} с частотой полива ${newPlant.watering_frequency} ?`
          await ctx.reply(msg, yesNoKeyboard()) // тут спрашивать да - нет не обязательно. оставить для удаления 
        break; 
      }
  } else {
      console.log('Это обычное текстовое сообщение без ответа.');
  }
});



// // Обработчик для ввода названия цветка и частоты полива
// bot.on('text', async (ctx) => {
//   const botState = ctx.state || {} ;
//   console.log(botState);

//   switch (botState.stage) {
//     case 'flowerName':
//       if (ctx.message && ctx.message.text) {
//         const flowerName = ctx.message.text;
//         botState.flowerName = flowerName;
        
//         botState.stage = 'wateringFrequency';
//         await ctx.reply('Введите частоту полива (в днях):');
//       } else {
//         await ctx.reply('Пожалуйста, введите корректное название цветка.');
//       }
//       break;
//     case 'wateringFrequency':
//       if (ctx.message && ctx.message.text && /^\d+$/.test(ctx.message.text)) {
//         const wateringFrequency = parseInt(ctx.message.text);

//         const flowerInfo = {
//           user_id: userSession.user_id,
//           flower_name: userSession.flowerName,
//           watering_frequency: wateringFrequency,
//         };

//         const result = await addFlower(flowerInfo);

//         if (result) {
//           ctx.reply('Цветок успешно добавлен', mainKeyboard);
//         } else {
//           ctx.reply('Ошибка добавления цветка!');
//         }

//         ctx.state = {};
//       } else {
//         await ctx.reply('Пожалуйста, введите корректную частоту полива (введите число).');
//       }
//       break;
//   }
// });

// // Обработчик для кнопок полива цветков
// bot.action(/water_(.+)/, async (ctx) => {
//   const flowerName = ctx.match[1];
//   ctx.reply(`Полив цветка "${flowerName}" отмечен!`);
// });

// // Обработчик для кнопки "Отключить напоминания"
// bot.action('disableReminder', async (ctx) => {
//   // Реализация отключения напоминаний
//   // ...

//   ctx.reply('Напоминания успешно отключены!');
// });

bot.launch();
