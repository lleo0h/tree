import * as Oceanic from "oceanic.js"
import { createCommand } from "../../models/createCommand.js"
import { createInteraction } from "../../models/createInteraction.js"
import { ActionRow } from "../../structures/builders/ActionRow.js"
import { Button } from "../../structures/builders/Button.js"

export default createCommand({
    type: "command",
    name: "dmail",
    description: "Send dmail",
    args: {
        "mention": {
            type: Oceanic.ApplicationCommandOptionTypes.STRING,
            name: "mention",
            description: "Write something for me to always remember, 36 bytes limit.",
            maxLength: 36,
            required: true
        }
    },
    async run(ctx) {
        return ctx.reply({
            content: "Dmail sent.",
            components: [
                new ActionRow()
                    .addComponent(
                        new Button()
                            .setID(`_dmail;${ctx.args.mention}`)
                            .setLabel("Message")
                            .setStyle("SECONDARY")
                    )
            ]
        })
    }
})

export const _dmail = createInteraction({
    name: "_dmail",
    type: "button",
    async run(ctx) {
        const [, email] = ctx.args
        ctx.data.reply({ content: email, flags: 64 })
    }
})