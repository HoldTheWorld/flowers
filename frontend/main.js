import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv'
dotenv.config()
const token = process.env.BOT_TOKEN
const bot = new Telegraf(token);
import { addFlower, addUser, checkUser } from "./requests.js"

const commandList = `
/new фикус 7 - добавить в свой список фикус, который нужно поливать раз в 7 дней 
/list - посмотреть список своих растений 
/change фикус 10 - изменить график полива для фикуса на 10 дней 
/water фикус - зафиксироровать полив фикуса сейчас 
/water фикус 24 - зафиксировать полив фикуса 24 часа назад 
/delete фикус - удалить фикус из списка растений 
/mute фикус - отключить напоминания о поливе для фикуса 
`
bot.start(async (ctx) => {
  const result =  await addUser(ctx.message.chat.username) // добавление пользователя в базу данных 
  result ? ctx.reply(commandList) :  
           ctx.reply(`Что-то пошло не так! 
                      Попробуйте повторить позднее.`)
})

// bot.hears('/new', (ctx) => {

//   console.log(ctx.message.text);
// })

bot.help((ctx) => {
  ctx.reply(commandList)
})


bot.command("new", (ctx) => {
  console.log(ctx.message.text);
})

bot.launch();
