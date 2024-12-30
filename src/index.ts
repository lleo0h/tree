import { server } from "./http/index.js"
import { client } from "./bot/index.js"

client.connect().then(() => client.load())

server.listen({ host: "0.0.0.0", port: 3333 }).then(i => {
    console.log("HTTP Server started")
})