import TelegramBot from 'npm:node-telegram-bot-api'
import * as telegramConfig from './config/telegram.ts'

const bot = new TelegramBot(telegramConfig.BOT_KEY);


export function sendNotification(text: string) {
    return bot.sendMessage(telegramConfig.CHAT_ID, text)
}