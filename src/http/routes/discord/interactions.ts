import * as Oceanic from "oceanic.js"
import { FastifyPluginAsync } from "fastify"
import { verifyKey } from "discord-interactions"
import { client } from "../../../bot/index.js"

export const route_interaction: FastifyPluginAsync = async (fastify) => {
    fastify.addHook("preHandler", async (req, reply) => {
        const signature = req.headers["x-signature-ed25519"] as string
        const timestamp = req.headers["x-signature-timestamp"] as string
        const isVerified = await verifyKey(JSON.stringify(req.body), signature, timestamp, client.verifyKey)
        if(!isVerified) return reply.code(401).send("Bad request signature")
    })

    fastify.post("/discord/interactions", (req, reply) => {
        const data = req.body as Oceanic.AnyRawInteraction
        switch(data.type) {
            case Oceanic.InteractionTypes.PING:
                reply.send({ type: 1 }); break
            case Oceanic.InteractionTypes.APPLICATION_COMMAND:
                client.command.runCommand(data as Oceanic.RawApplicationCommandInteraction); break
            case Oceanic.InteractionTypes.MESSAGE_COMPONENT:
                client.command.runInteraction(data as Oceanic.RawMessageComponentInteraction); break
            case Oceanic.InteractionTypes.MODAL_SUBMIT:
                client.command.runModalSubmit(data as Oceanic.RawModalSubmitInteraction); break
            case Oceanic.InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE:
                client.command.runAutoComplete(data as Oceanic.RawAutocompleteInteraction); break
        }
    })
}