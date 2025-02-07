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
            case Oceanic.InteractionTypes.PING: {
                return { type: 1 }
            }
            case Oceanic.InteractionTypes.APPLICATION_COMMAND: {
                const interaction = new Oceanic.CommandInteraction(data as Oceanic.RawApplicationCommandInteraction, client)
                const command = client.command.getCommand([interaction.data.name].concat(interaction.data.options.getSubCommand() || []))
                if(command) {
                    client.command.runCommand({
                        type: "slash", command, interaction
                    })
                } break
            }
            case Oceanic.InteractionTypes.MESSAGE_COMPONENT: {
                const interaction = new Oceanic.ComponentInteraction(data as Oceanic.RawMessageComponentInteraction, client)
                if(interaction.data.customID.startsWith("_")) {
                    client.command.runInteraction({
                        interaction, type: "row"
                    })
                } else {
                    const name = interaction.data.customID.split(";")[0]
                    const command = client.command.getCommand([name])
                    if(command && command.component === true) client.command.runCommand({
                        type: "component",
                        command,
                        interaction
                    })
                } break
            }
            case Oceanic.InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE: {
                const interaction = new Oceanic.AutocompleteInteraction(data as Oceanic.RawAutocompleteInteraction, client)
                const autocomplete = client.command.getAutoComplete(interaction)
                if(!autocomplete) return
                client.command.runAutoComplete({ interaction, autocomplete })
                break
            }
            case Oceanic.InteractionTypes.MODAL_SUBMIT: {
                const interaction = new Oceanic.ModalSubmitInteraction(data as Oceanic.RawModalSubmitInteraction, client)
                client.command.runInteraction({ interaction, type: "modal" })
            }
        }
    })
}