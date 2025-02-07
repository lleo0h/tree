import fs from "fs"
import * as Oceanic from "oceanic.js"
import { AnyCommand, CommandArguments, Group, Command, CommandContext, GetTypeFromCommandArgument, CommandArgument } from "../models/createCommand.js"
import { InternalInteraction, Interaction, InteractionTypes, InteractionContext } from "../models/createInteraction.js"

type GenerateDataRunner<T extends string, K extends any> = { 
    type: T
    interaction: K
}
type DataCommandRunner = GenerateDataRunner<"slash", Oceanic.CommandInteraction> | GenerateDataRunner<"component", Oceanic.ComponentInteraction>
type DataInteractionRunner = GenerateDataRunner<"row", Oceanic.ComponentInteraction> | GenerateDataRunner<"modal", Oceanic.ModalSubmitInteraction>

export class CommandManager {
    PREFIX = ".."
    commands = new Map<string, AnyCommand<CommandArguments>>()
    interactions = new Map<string, Interaction<keyof InteractionTypes>>()
    autocompletes = new Map<string, CommandArgument["autocomplete"]>() //Reference CommandArg

    async loadCommand(dir: string, internal_group?: Group) {
        let group = internal_group
        const readdir = fs.readdirSync(dir)
        const index = readdir.find(i => i.startsWith("index"))
        if(index) {
            readdir.splice(readdir.indexOf(index), 1)
            group = (await import(`${dir}/${index}`)).default as Group
            if(!internal_group) {
                this.commands.set(group.name, group)
            } else internal_group.commands.set(group.name, group)
        }
        for(const file of readdir) {
            const stats = fs.statSync(`${dir}/${file}`)
            if(stats.isDirectory()) {
                await this.loadCommand(`${dir}/${file}`, group)
            } else {
                const imports = await import(`${dir}/${file}`)
                const command = imports.default as Command<CommandArguments>
                if(group) {
                    group.commands.set(command.name, command)
                } else {
                    this.commands.set(command.name, command)
                }
                this.loadCommandInteraction(imports)
            }
        }
    }

    private loadCommandInteraction(imports: {[key: string]: any}) {
        for(const i of Object.values(imports)) {
            if(i instanceof InternalInteraction) {
                this.interactions.set(i.data.name, i.data)
            }
        }
    }

    async loadAutoCompleteFromCommand(commands: AnyCommand<CommandArguments>[], baseName: string = "") {
        for(const anyCommand of commands) {
            if(anyCommand.type == "command") {
                for(const arg of Object.values(anyCommand.args)) {
                    if(!arg.autocomplete) continue
                    this.autocompletes.set(`${baseName ? `${baseName} ${anyCommand.name}` : anyCommand.name} ${arg.name}`, arg.autocomplete)
                }
            }
            else this.loadAutoCompleteFromCommand(Array.from(anyCommand.commands.values()), `${baseName} ${anyCommand.name}`)
        }
    }

    async createCommandArgs<T extends CommandArguments>(
        command: Command<CommandArguments>,
        response: Oceanic.CommandInteraction | Oceanic.ComponentInteraction | Oceanic.Message
    ) {
        const data = {} as { [K in keyof T]: GetTypeFromCommandArgument<T[K]> }
        const fromArgs = Object.entries(command.args)
        let args: Oceanic.InteractionOptionsWithValue[] = []
        if(response instanceof Oceanic.CommandInteraction) {
            let raw = response.data.options.raw
            for(const r of raw) {
                if(r.type == 1 || r.type == 2) {
                    if(!r.options) break
                    raw = r.options
                }
            }
            args = (raw as Oceanic.InteractionOptionsWithValue[]).map(i => {
                return {
                    name: fromArgs.find(arg => arg[1].name == i.name)?.[0],
                    type:  i.type,
                    value: i.value
                }
            }) as Oceanic.InteractionOptionsWithValue[]
        }
        else {
            let content: string[] = []
            if(response instanceof Oceanic.Message) {
                content = response.content
                    .slice(this.PREFIX.length)
                    .split(" ")
                    .slice(response.content.slice(this.PREFIX.length).split(" ").indexOf(command.name) + 1)
            } else {
                content = response.data.customID.split(";").slice(1)
            }
            args = fromArgs.map((i, index) => {
                return {
                    name: i[0],
                    type: command.args[i[0]].type,
                    value: content[index]
                }
            }) as Oceanic.InteractionOptionsWithValue[]
        }

        for(const arg of args) {
            switch(arg.type) {
                case Oceanic.ApplicationCommandOptionTypes.USER: {
                    if(!arg.value && command.args[arg.name].required) throw command.args[arg.name].required!.message
                    let user: Oceanic.User | undefined
                    if(response instanceof Oceanic.CommandInteraction) {
                        user = response.data.resolved.users.get(arg.value)
                    } else user = await response.client.rest.users.get(arg.value?.replace(/[<@>]/, ""))
                    ;(data[arg.name] as Oceanic.User | undefined) = user
                    break
                }
                case Oceanic.ApplicationCommandOptionTypes.NUMBER: {
                    if(isNaN(arg.value) == true && command.args[arg.name].required) throw command.args[arg.name].required!.message
                    ;(data[arg.name] as number | undefined) = Number(arg.value)
                    break
                }
                default: 
                    if(!arg.value && command.args[arg.name].required) throw command.args[arg.name].required!.message
                    ;(data[arg.name] as never | undefined) = arg.value as never     
            }
        }
        return data
    }

    getCommand(name: string[]): Command<CommandArguments> | undefined {
        let command: AnyCommand<CommandArguments> | undefined = this.commands.get(name[0])
        for(let i = 1; i < name.length; i++) {
            if(command && command.type === "group") {
                command = command.commands.get(name[i])
            } else break
        }
        if(command?.type == "group") throw new Error("Groups cannot be executed directly as they only store commands.")
        return command
    }
    
    getAutoComplete(interaction: string | Oceanic.AutocompleteInteraction) {
        const focused = typeof interaction === "string" ? interaction : (
            [interaction.data.name]
                .concat(
                    interaction.data.options.getSubCommand() || [], 
                    interaction.data.options.getFocused()?.name || []
                )
            )
            .join(" ")
        return this.autocompletes.get(focused)
    }

    async runCommand({ command, interaction }: DataCommandRunner & { command: Command<CommandArguments> }) {
        const ctx = new CommandContext(interaction)
        ctx.args = await this.createCommandArgs(command, interaction)
        await command.run(ctx)
    }

    async runAutoComplete({ autocomplete, interaction }: {
        autocomplete: NonNullable<CommandArgument["autocomplete"]>
        interaction: Oceanic.AutocompleteInteraction
    }) {
        return autocomplete(interaction)
    }

    async runInteraction({ interaction }: DataInteractionRunner) {
        const args = interaction.data.customID.split(";")
        return await this.interactions.get(args[0])?.run(new InteractionContext(interaction, args))
    }
}