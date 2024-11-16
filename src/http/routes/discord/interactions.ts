import { FastifyPluginAsync } from "fastify"
import { verifyKey } from "discord-interactions"
import {
    APIApplicationCommandInteraction,
    APIMessageComponentInteraction,
    APIModalSubmitInteraction,
    APIPingInteraction,
    APIApplicationCommandAutocompleteInteraction,
    InteractionType
} from "discord-api-types/v10"
import { bot } from "../../../bot/structures/Client.js"

export type APIAnyInteractionRecive = APIApplicationCommandInteraction | APIMessageComponentInteraction | APIModalSubmitInteraction | APIPingInteraction | APIApplicationCommandAutocompleteInteraction

export const route_interaction: FastifyPluginAsync = async (fastify) => {
    fastify.addHook("preHandler", async (req, reply) => {
        const signature = req.headers["x-signature-ed25519"] as string
        const timestamp = req.headers["x-signature-timestamp"] as string
        const isVerified = await verifyKey(JSON.stringify(req.body), signature, timestamp, bot.verifyKey)
        if(!isVerified) return reply.code(401).send("Bad request signature")
    })
    fastify.post("/discord/interactions", (req, reply) => {
        const data = req.body as APIAnyInteractionRecive
        if(data.type == 1) return reply.send({ type: 1 })
        else if(data.type == InteractionType.ApplicationCommand) {
            bot.command.runCommand(data)
        }
        else if(data.type == InteractionType.MessageComponent) {
            bot.command.runInteraction(data)
        }
        else if(data.type == InteractionType.ApplicationCommandAutocomplete) {
            bot.command.runAutoComplete(data)
        }
        else if(data.type == InteractionType.ModalSubmit) {
            bot.command.runModalSubmit(data)
        }
    })
}