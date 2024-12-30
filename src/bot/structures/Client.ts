import path from "path"
import * as Oceanic from "oceanic.js"
import { CommandManager } from "../managers/CommandManager.js"
import { AnyCommand, CommandArguments } from "../models/createCommand.js"

export class Client extends Oceanic.Client {
    command = new CommandManager(this)

    constructor(token: string) {
        super({
            auth: `Bot ${token}`,
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
                : this.mappingSlash(Array.from(i.commands.values()), true)
            }
        })

        return command
    }

    async load() {
        await this.command.loadCommand(path.resolve(__dirname, '../', 'commands'))
        await this.command.loadAutoCompleteFromCommands(Array.from(this.command.commands.values()))
    }

    async connect() {
        await this.restMode(true)
    }
}