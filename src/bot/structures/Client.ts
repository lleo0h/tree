import path from "path"
import * as Oceanic from "oceanic.js"
import { CommandManager } from "../managers/CommandManager.js"
import { AnyCommand, CommandArguments } from "../models/createCommand.js"

export class Client extends Oceanic.Client {
    command = new CommandManager(this)

    constructor() {
        super({
            auth: `Bot ${process.env.TOKEN}`,
            disableCache: 'no-warning',
        })
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

    get verifyKey(): string {
        return (this.application as Oceanic.ClientApplication & Oceanic.JSONApplication).verifyKey
    }

    async connect() {
        await this.command.loadCommand(path.resolve(__dirname, '../', 'commands'))
        await this.command.loadArgumentsFromCommands(this.command.commands)
        await this.restMode()
    }
}

export const bot = new Client()