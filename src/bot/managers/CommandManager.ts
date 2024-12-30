import fs from "fs"
import * as Oceanic from "oceanic.js"
import { AnyCommand, CommandArguments, Group, Command, CommandContext, GetTypeFromCommandArgument, CommandArgument } from "../models/createCommand.js"
import { InternalInteraction, Interaction, InteractionTypes, InteractionContext } from "../models/createInteraction.js"

export class CommandManager {
    commands = new Map<string, AnyCommand<CommandArguments>>()
    interactions = new Map<string, Interaction<keyof InteractionTypes>>()
    autocompletes = new Map<string, CommandArgument["autocomplete"]>() //Reference CommandArg
    private client: Oceanic.Client

    constructor(client: Oceanic.Client) {
        this.client = client
    }

    async loadAutoCompleteFromCommands(commands: AnyCommand<CommandArguments>[], baseName: string = "") {
        for(const anyCommand of commands) {
            if(anyCommand.type == "command") {
                for(const arg of Object.values(anyCommand.args)) {
                    if(!arg.autocomplete) continue
                    this.autocompletes.set(`${baseName ? `${baseName} ${anyCommand.name}` : anyCommand.name} ${arg.name}`, arg.autocomplete)
                }
            }
            else this.loadAutoCompleteFromCommands(Array.from(anyCommand.commands.values()), `${baseName} ${anyCommand.name}`)
        }
    }

    private loadCommandInteraction(imports: {[key: string]: any}) {
        for(const i of Object.values(imports)) {
            if(i instanceof InternalInteraction) {
                this.interactions.set(i.data.name, i.data)
            }
        }
    }

    async loadCommand(dir: string, internal_group?: Group) {
        let group = internal_group
        const readdir = fs.readdirSync(dir)
        const index = readdir.find(i => i.startsWith("index"))
        if(index) {
            readdir.splice(readdir.indexOf(index), 1)
            group = (await import(`${dir}/index.js`)).default as Group
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

    createArgs<T extends CommandArguments>(
        command: Command<CommandArguments>,
        interaction: Oceanic.CommandInteraction
    ) {
        const data = {} as { [K in keyof T]: GetTypeFromCommandArgument<T[K]> }
        const fromArgs = Object.entries(command.args)
        for(const value of interaction.data.options.getOptions()) {
            const key = String(fromArgs.find(i => i[1].name == value.name)?.[0])
            switch(value.type) {
                case Oceanic.ApplicationCommandOptionTypes.USER: {
                    (data[key] as Oceanic.User | undefined) = interaction.data.resolved.users.get(value.value)
                    break
                }
                default: 
                    ;(data[key] as never | undefined) = value.value as never
            }
        }
        return data
    }

    async runCommand(data: Oceanic.RawApplicationCommandInteraction) {
        const i = new Oceanic.CommandInteraction(data, this.client)
        const content = [i.data.name].concat(i.data.options.getSubCommand() || [])
        const command = this.getCommand(content)
        if(!command) return
        const ctx = new CommandContext(i)
        ctx.args = this.createArgs(command, i)
        command.run(ctx)
    }

    async runInteraction(data: Oceanic.RawMessageComponentInteraction) {
        const args = data.data.custom_id.split(";")
        const interaction = this.interactions.get(args[0])
        if(!interaction) return
        const i = new Oceanic.ComponentInteraction(data as unknown as Oceanic.RawMessageComponentInteraction, this.client)
        if(i.data.componentType == 2 && interaction.type == "button") {
            interaction.run(new InteractionContext(i, args))
        } 
        else if([3, 4, 5, 6, 7, 8].includes(i.data.componentType) && interaction.type == "menu") {
            interaction.run(new InteractionContext(i, args))
        }
    }

    async runModalSubmit(data: Oceanic.RawModalSubmitInteraction) {
        const i = new Oceanic.ModalSubmitInteraction(data as Oceanic.RawModalSubmitInteraction, this.client)
        const args = data.data.custom_id.split(";")
        const interaction = this.interactions.get(args[0])
        if(!interaction) return
        interaction.run(new InteractionContext(i, args))
    }

    async runAutoComplete(data: Oceanic.RawAutocompleteInteraction) {
        const i = new Oceanic.AutocompleteInteraction(data, this.client)
        const focused = ([i.data.name]
            .concat(
                i.data.options.getSubCommand() || [], 
                i.data.options.getFocused()?.name || [])
            )
            .join(" ")

        const autocomplete = this.autocompletes.get(focused)
        if(autocomplete) autocomplete(i)
    }
}