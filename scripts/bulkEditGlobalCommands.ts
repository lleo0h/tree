import { Client, __dir } from "../src/bot/structures/Client.js"

const time = Date.now()
const client = new Client(process.env.APPLICATION_TOKEN as string)
client.connect().then(async () => {
    await client.command.loadCommand(`${__dir}/commands`)
    await client.application.bulkEditGlobalCommands(
        client.mappingSlash(Array.from(client.command.commands.values()))
    )
    console.log(`Bulk editing of commands completed successfully in ${((Date.now() - time) / 1000).toFixed(2)} seconds.`)
})