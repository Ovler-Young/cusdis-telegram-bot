import { Message } from '.pnpm/typegram@3.4.3/node_modules/typegram'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { Telegraf } from 'telegraf'
import { client } from '../redis'
import axios from 'axios'

const { BOT_TOKEN, VERCEL_URL } = process.env

const bot = new Telegraf(BOT_TOKEN)

interface Callback {
    message: Message;
    data: string;
}

bot.command('start', (ctx) => {
    ctx.reply('Welcome to use Cusdis Bot')
})

bot.command('gethook', (ctx) => {
    let chanId = ctx.message.chat.id
    let hookUrl = `https://${VERCEL_URL}/api/hook/${chanId}`
    ctx.reply(`Your Webhook URL:\n ${hookUrl}`)
})

bot.on('callback_query', async (ctx) => {
    let callback = ctx.callbackQuery as Callback
    let chatId = callback.message.chat.id
    let action = callback.data
    switch (action) {
        case 'approve': {
            let key = chatId.toString() + callback.message.message_id.toString()
            
            await client.connect()
            let link = await client.get(key)
            if (link) {
                let api = link.replace("open", "api/open")

                let res = await axios.post(api)
            
                if (res.status == 200) {
                    ctx.answerCbQuery("Approved")
                    await client.del(key)
                }
            } else {
                ctx.reply("Fail to get link")
            }
            break
        }
    }
})

export default async (req: VercelRequest, res: VercelResponse) => {
    try {
        await bot.handleUpdate(req.body, res)
    } finally {
        res.status(200).end()
    }
}