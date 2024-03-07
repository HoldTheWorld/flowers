import { Telegraf, Markup  } from 'telegraf';
import * as dotenv from 'dotenv';
import { addUser, addPlant, getUserId, getPlants, waterPlantByPlantId, waterPlantByUserId } from "./requests.js";
import moment from 'moment';

dotenv.config();
const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);
const watchFreq = moment.duration({ 'hours': 12 }); // check
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
// await ctx.reply(msg, yesNoKeyboard())  

const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Добавить растения', 'addPlant')],
  [Markup.button.callback('Полить растение', 'waterPlant')],
  [Markup.button.callback('Полить все растения', 'waterAllPlants')], // возможно убрать
  [Markup.button.callback('Изменить частоту полива', 'editPlant')],
  [Markup.button.callback('Удалить растение', 'deletePlant')],
]).resize();

//https://github.com/znezniV/iad-telegram-plantbot
//https://github.com/telegraf/telegraf/issues/705
// session middleware

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
      // начинается наблюдение за 
    } else {
      ctx.reply(`Ошибка. Пожалуйста, попробуйте позднее.`);
    }
});

function startWatch(user_id, chat_id) {
  let plants =  getPlants(user_id)
  interval = setInterval(chat_id => {
    // проход по базе данных цветов пользователя 
    // сложение последнего полива и частоты полива 
    // если превышает текущее время, is_fina = false  , уведомление о поливе 
  }, watchFreq, chat_id);
}

// bot.use((ctx, next) => {
//   console.log('enter middleware');
//   ctx.state.stage = 'testStage'
//   next()
// })

// Обработчик для добавления цветка
bot.action('addPlant', async (ctx) => {
  await ctx.deleteMessage();
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
  await ctx.deleteMessage();
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  if (user_id > 0) {
    let plants = await getPlants(user_id, []) // array
    if (plants.length) {
      let moreButtons = [{name:'Полить все', id: 'water_0'}]

      ctx.reply('Выберите растение для полива', await plantListButtons(plants, moreButtons));
      // при выборе растения  - функция обновляет is_fine = true и время полива на moment.now()
    } else {
      ctx.reply('В вашем списке нет растений', mainKeyboard);
    }
  }
})

async function plantListButtons(plants, moreButtons) {
    const keyPlantList = Markup.inlineKeyboard(
      plants.map((plant) => [Markup.button.callback(plant.plant_name.trim(), `water_${plant.id}`)])
    );
    if (moreButtons.length) {
      moreButtons.map((button) => keyPlantList.reply_markup.inline_keyboard.push([Markup.button.callback(button.name, button.id)]))
    }
    return keyPlantList
}

bot.action(/water_/, async (ctx) => {
  await ctx.deleteMessage();
  
  const plantId = ctx.callbackQuery.data.replace('water_', '');
  if (!isNaN(parseFloat(plantId))) {
    let userId = await getUserId(ctx.update.callback_query.from.username);
    let waterRes = await waterPlant(parseFloat(plantId), userId)
    // TODO function should return the number of updated rows, it could be a count of watered plants for the message below
    waterRes ? ctx.reply(`растение полито  ${plantId}`) : ctx.reply(`Ошибка при обновлении данных! ${plantId}`, mainKeyboard);
  } else {
    ctx.reply(`Непредвиденная ошибка`, mainKeyboard)
  }
});

async function waterPlant(plantId, userId) {
  if (plantId === 0) {
    return waterPlantByUserId(userId, moment.now())
  } else {
    return waterPlantByPlantId(plantId, moment.now())
  }
}

bot.action('editPlant', async(ctx) => {
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  if (user_id > 0) {
    let plants = getPlants(user_id) // array
    if (plants.length) {
      // сформировать список растений в виде кнопок !
      // при выборе растения - сообщение с force_reply - введите новую частоту полива 
      // валидация, затем обновление БД
    } else {
      // сначала добавьте растение 
    }
  }
})

bot.action('deletePlant', async(ctx) => {
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  if (user_id > 0) {
    let plants = getPlants(user_id) // array
    if (plants.length) {
      // сформировать список растений в виде кнопок или чекбоксов 
      // при выборе растения - yesno - обновление БД - растение удалено 
    } else {
      // сначала добавьте растение 
    }
  }
})

function splitInput(inputString) {
  const regex = /^(.*\S)\s(\d+(\.\d+)?)\s*$/;
  const matches = inputString.match(regex);
  const plantData = {}
  if (matches && matches.length >= 3) {
    plantData.plant_name = matches[1];
    const wateringFrequency = parseFloat(matches[2]);
    if (!isNaN(wateringFrequency)) {
        plantData.watering_frequency = wateringFrequency;
    } else {
        console.log("Ошибка при парсинге частоты полива");
        return null
    }
  } else {
    console.log("Не удалось найти совпадение");
    return null
  }
  return plantData
}


bot.on('text', async (ctx) => {
  const user_id = await getUserId(ctx.message.from.username);
  const regExp = /^.+\s\d+(\.\d+)?$/
 
  if (user_id > 0) {
      if (ctx.message.reply_to_message) {
          const repliedText = ctx.message.reply_to_message.text;
          switch (repliedText) {
            case presetNewPlant:
            case presetIncorrect:
              const input = ctx.message.text.trim().replace(/\s{2,}/g, ' ')
              if (regExp.test(input)) {
                let plantData = splitInput(input)
                if (plantData !== null) {
                  const newPlant = {
                    user_id: user_id, 
                    plant_name: plantData.plant_name,
                    watering_frequency: plantData.watering_frequency,
                    last_watered: moment.now(),
                    is_fine: true
                  }

                  const result = await addPlant(newPlant);
                  if (result) {
                    ctx.reply(`Растение "${plantData.plant_name}" с частотой полива ${plantData.watering_frequency.toString()} д. успешно добавлено`, mainKeyboard);
                  } else {
                    ctx.reply('Ошибка добавления растения!');
                  }
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
