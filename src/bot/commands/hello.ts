import * as Oceanic from "oceanic.js"
import { createCommand } from "../models/createCommand.js"
import { createInteraction } from "../models/createInteraction.js"
import { ActionRow } from "../structures/builders/ActionRow.js"
import { Button } from "../structures/builders/Button.js"
import { Embed } from "../structures/builders/Embed.js"

export default createCommand({
    type: "command",
    name: "hello",
    description: "send hello world",
    // defaultMemberPermissions: (
    //     Oceanic.Permissions.MANAGE_MESSAGES+
    //     Oceanic.Permissions.BAN_MEMBERS
    // ).toString(),
    args: {
        "mention": {
            type: Oceanic.ApplicationCommandOptionTypes.STRING,
            name: "mention",
            description: "add mention",
            required: true,
            async autocomplete(i) {
                i.result([{
                    name: String(Date.now()),
                    value: "test"
                }])
            }
        },
        "user": {
            type: Oceanic.ApplicationCommandOptionTypes.USER,
            name: "user",
            description: "add user",
            required: true
        }
    },
    async run(ctx) {
        ctx.reply({
            embeds: [
                new Embed().setDescription("Hello World")
            ],
            components: [
                new ActionRow()
                    .addComponent(
                        new Button()
                            .setID(`button;mention:${ctx.args.mention}`)
                            .setLabel("button")
                            .setStyle("SECONDARY")
                    )
            ]
        })
    }
})

export const interaction_button = createInteraction({
    type: "button",
    name: "button",
    async run(ctx) {
        ctx.data.reply({content: `button stateless ${ctx.getData("mention")}`, flags: 64})
    }
})