import { Telegraf, Markup  } from 'telegraf';
import * as dotenv from 'dotenv';
import { addUser, addPlant, getUserId } from "./requests.js";
import moment from 'moment';

dotenv.config();
const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);
const watchFreq = moment.duration({ 'seconds': 10 });
let interval

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

  updatePlant() {

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
const presetIncorrect = 'Введены некорректные значения! Попробуйте снова. Например "Антуриум 7"'
function yesNoKeyboard() {
  return Markup.inlineKeyboard([
      Markup.button.callback('Да', 'yes'),
      Markup.button.callback('Нет', 'no')
  ])
}
const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Добавить растения', 'addPlant')],
  [Markup.button.callback('Полить растение', 'waterPlant')],
  [Markup.button.callback('Полить все растения', 'updatePlant')],
  [Markup.button.callback('Изменить частоту полива', 'editPlant')],
  [Markup.button.callback('Удалить растение', 'deletePlant')],
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

function startWatch(user_id) {
  let plants =  getPlants(user_id)
  interval = setInterval(chatId => {
        
  }, watchFreq, ctx.chat.id);
}

// bot.use((ctx, next) => {
//   console.log('enter middleware');
//   ctx.state.stage = 'testStage'
//   next()
// })

// Обработчик для добавления цветка
bot.action('addPlant', async (ctx) => {
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

bot.action('waterPlant', async(ctx) => {

})

bot.on('text', async (ctx) => {
  const user_id = await getUserId(ctx.message.from.username);
  const regExp = /^[^\d]+ \d+(\.\d+)?$/ 
 // доработать регулярку  
  if (user_id > 0) {
      // Проверяем, есть ли информация об исходном сообщении
      if (ctx.message.reply_to_message) {
          const repliedText = ctx.message.reply_to_message.text;
          switch (repliedText) {
            case presetNewPlant:
            case presetIncorrect:
              const input = ctx.message.text.trim().replace(/\s{2,}/g, ' ')
              if (regExp.test(input)) {
              // доработать поиск  значений ниже
                  let plantName = input.split(' ')[0]
                  let watFreq = parseFloat(input.split(' ')[1])
                  const newPlant = {
                    user_id: user_id, 
                    plant_name: plantName,
                    watering_frequency: watFreq,
                    last_watered: moment.now(),
                    is_fine: true
                  }
                  // let msg = `Вы хотите добавить растение  ${newPlant.name} с частотой полива ${newPlant.watering_frequency} ?`
                  // await ctx.reply(msg, yesNoKeyboard()) // тут спрашивать да - нет не обязательно. оставить для удаления 
                  const result = await addPlant(newPlant);
                  if (result) {
                    ctx.reply(`Растение "${plantName}" с частотой полива ${watFreq.toString()} д. успешно добавлено`, mainKeyboard);
                  } else {
                    ctx.reply('Ошибка добавления растения!');
                  }
              } else {
                await ctx.replyWithHTML(presetIncorrect, {
                  reply_markup: {
                      force_reply: true,
                  },
                });
              }
            break; 
          }
      } else {
        ctx.reply('Что вы хотите сделать?', mainKeyboard);
      }

  }
});



// // Обработчик для ввода названия цветка и частоты полива
// bot.on('text', async (ctx) => {
//   const botState = ctx.state || {} ;
//   console.log(botState);

//   switch (botState.stage) {
//     case 'plantName':
//       if (ctx.message && ctx.message.text) {
//         const plantName = ctx.message.text;
//         botState.plantName = plantName;
        
//         botState.stage = 'wateringFrequency';
//         await ctx.reply('Введите частоту полива (в днях):');
//       } else {
//         await ctx.reply('Пожалуйста, введите корректное название цветка.');
//       }
//       break;
//     case 'wateringFrequency':
//       if (ctx.message && ctx.message.text && /^\d+$/.test(ctx.message.text)) {
//         const wateringFrequency = parseInt(ctx.message.text);

//         const plantInfo = {
//           user_id: userSession.user_id,
//           plant_name: userSession.plantName,
//           watering_frequency: wateringFrequency,
//         };

//         const result = await addplant(plantInfo);

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
//   const plantName = ctx.match[1];
//   ctx.reply(`Полив цветка "${plantName}" отмечен!`);
// });

// // Обработчик для кнопки "Отключить напоминания"
// bot.action('disableReminder', async (ctx) => {
//   // Реализация отключения напоминаний
//   // ...

//   ctx.reply('Напоминания успешно отключены!');
// });

bot.launch();
