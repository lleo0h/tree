import path from "path"
import * as Oceanic from "oceanic.js"
import { CommandManager } from "../managers/CommandManager.js"
import { AnyCommand, CommandArguments } from "../models/createCommand.js"
import url from "url"

export const __dir = path.resolve(url.fileURLToPath(import.meta.url)+"/../../")

export class Client extends Oceanic.Client {
    command = new CommandManager()

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
                options: i.type == "command" ? Object.values(i.args).filter(arg => i.component ? !arg.name.startsWith("_") : true).map(i => {
                    return {
                        ...i,
                        autocomplete: !!i.autocomplete,
                        required: !!i.required?.message
                    }
                })
                : this.mappingSlash(Array.from(i.commands.values()), true)
            }
        })

        return command
    }

    async load() {
        await this.command.loadCommand(path.resolve(__dir, 'commands'))
        await this.command.loadAutoCompleteFromCommand(Array.from(this.command.commands.values()))
    }

    async connect() {
        await this.restMode(true)
    }
}