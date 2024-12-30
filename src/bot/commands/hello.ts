import { createCommand } from "../models/createCommand.js"

export default createCommand({
    type: "command",
    name: "hello",
    description: "Send hello",
    // defaultMemberPermissions: (
    //     Oceanic.Permissions.MANAGE_MESSAGES+
    //     Oceanic.Permissions.BAN_MEMBERS
    // ).toString(),
    args: {},
    async run(ctx) {
        return ctx.reply("Hello, mad scientist.")
    }
})