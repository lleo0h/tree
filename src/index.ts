import { app } from "./http/server.js"
import { bot } from "./bot/structures/Client.js"

bot.connect()

app.listen({ host: "0.0.0.0", port: 3333 }).then(i => {
    console.log(`HTTP Server started`)
})