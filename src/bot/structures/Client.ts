import path from "path"
import * as Oceanic from "oceanic.js"
import { CommandManager } from "../managers/CommandManager.js"
import { AnyCommand, CommandArguments } from "../models/createCommand.js"

export class Client extends Oceanic.Client {
    command = new CommandManager(this)
    constructor() {
        super({
            auth: `Bot ${process.env.BOT_TOKEN}`,
            disableCache: 'no-warning',
        })
    }

    get verifyKey(): string {
        return (this.application as Oceanic.ClientApplication & Oceanic.JSONApplication).verifyKey
    }

    mappingSlash(commands: AnyCommand<CommandArguments>[], subcommand?: boolean): Oceanic.CreateApplicationCommandOptions[] {
        const command = commands.map((i) => {
            return {
                ...i,
                type: subcommand && i.type == "group" ? 2 : 1,
                options: i.type == "command" ? Object.values(i.args).map(i => {
                    return {
                        ...i,
                        autocomplete: i.autocomplete ? true : undefined,   
                    }
                })
                : this.mappingSlash(i.commands, true)
            }
        })

        return command
    }

    bulkEditGlobalCommands() {
        return this.application.bulkEditGlobalCommands(
            this.mappingSlash(this.command.commands)
        )
    }

    bulkEditGuildCommands(guild: string) {
        return this.application.bulkEditGuildCommands(
            guild,
            this.mappingSlash(this.command.commands, false)
        )
    }

    async load() {
        await this.command.loadCommand(path.resolve(__dirname, '../', 'commands'))
        await this.command.loadAutoCompleteFromCommands(this.command.commands)
        return this
    }

    async connect() {
        await this.restMode()
    }
}

export const bot = new Client()