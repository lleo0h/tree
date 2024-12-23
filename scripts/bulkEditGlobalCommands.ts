import { bot } from "../src/bot/structures/Client.js"

const initTime = Date.now()

bot.connect().then(async () => {
    await bot.command.loadCommand(`${__dirname}/../src/bot/commands`)
    bot.bulkEditGlobalCommands().then(() => {
        console.log(`Bulk editing of commands completed successfully in ${((Date.now() - initTime) / 1000).toFixed(2)} seconds`)
    })
})