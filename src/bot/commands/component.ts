import * as Oceanic from "oceanic.js"
import { createCommand } from "../models/createCommand.js"
import { Embed } from "../structures/builders/Embed.js"
import { ActionRow } from "../structures/builders/ActionRow.js"
import { Button } from "../structures/builders/Button.js"

export default createCommand({
    type: "command",
    name: "component",
    description: "Testing command component mode",
    args: {
        "_message": {
            name: "message",
            description: "Internal props string",
            type: Oceanic.ApplicationCommandOptionTypes.STRING
        }
    },
    component: true,
    async run(ctx) {
        if(ctx.args._message) {
            return ctx.reply({
                embed: new Embed().setDescription(`Your random phrase is ${ctx.args._message}`),
                flags: 64
            })
        } else {
            const contents = ["Mad cientist", "2010", "El psy kongron"]
            const math = Math.floor(contents.length * Math.random())
            return ctx.reply({
                embed: new Embed().setDescription("--- --- ---"),
                components: [
                    new ActionRow().addComponent(
                        new Button()
                            .setID(`component;${contents[math]}`)
                            .setLabel("Your message stateless")
                    )
                ]
            })
        }
    }
})