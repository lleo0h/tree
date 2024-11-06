import { createCommand } from "../../models/createCommand.js"

export default createCommand({
    type: "command",
    name: "mention",
    description: "your mention",
    args: {},
    async run(ctx) {
        ctx.reply(ctx.data.user.mention)
    }
})