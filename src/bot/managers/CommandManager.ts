import fs from "fs"
import * as Oceanic from "oceanic.js"
import { APIApplicationCommandInteraction, APIMessageComponentInteraction, APIApplicationCommandAutocompleteInteraction, APIModalSubmitInteraction } from "discord-api-types/v10"
import { InternalInteraction, Interaction, InteractionTypes, InteractionContext } from "../models/createInteraction.js"
import { AnyCommand, Command, CommandArguments, Group, GetTypeFromCommandArgument, CommandContext, CommandArgument } from "../models/createCommand.js"
import { type Client } from "../structures/Client.js"

export class CommandManager {
    commands: AnyCommand<CommandArguments>[] = []
    interactions: Interaction<keyof InteractionTypes>[] = []
    private internalCacheAutocomplete = new Map<string, CommandArgument["autocomplete"]>()
    private client: Client

    constructor(client: Client) {
        this.client = client
    }

    private loadInteraction(imports: {[key: string]: any}) {
        for(const i of Object.values(imports)) {
            if(i instanceof InternalInteraction) {
                this.interactions.push(i.data)
            }
        }
    }

    async loadArgumentsFromCommands(commands: AnyCommand<CommandArguments>[], baseName: string = "") {
        for(const anyCommand of commands) {
            if(anyCommand.type == "command") {
                for(const arg of Object.values(anyCommand.args)) {
                    if(!arg.autocomplete) continue
                    this.internalCacheAutocomplete.set(`${baseName ? `${baseName} ${anyCommand.name}` : anyCommand.name} ${arg.name}`, arg.autocomplete)
                }
            }
            else this.loadArgumentsFromCommands(anyCommand.commands, `${baseName} ${anyCommand.name}`)
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
                this.commands.push(group)
            }
            else {
                internal_group.commands.push(group)
            }
        }
        for(const file of readdir) {
            const stats = fs.statSync(`${dir}/${file}`)
            if(stats.isDirectory()) {
                await this.loadCommand(`${dir}/${file}`, group)
            } 
            else {
                const imports = await import(`${dir}/${file}`)
                const command = imports.default as Command<CommandArguments>
                if(group) {
                    group.commands.push(command)
                } 
                else {
                    this.commands.push(command)
                }
                this.loadInteraction(imports)
            }
        }
    }

    getCommand(name: string[]): Command<CommandArguments> | undefined {
        let command: AnyCommand<CommandArguments> | undefined = this.commands.find(i => i.name == name[0])
        while(command?.type == "group") {
            name.shift()
            command = command.commands.find(i => i.name == name[0])
        }
        return command
    }

    createCommandArgs<T extends CommandArguments>(
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

    async runInteraction(data: APIMessageComponentInteraction) {
        const args = data.data.custom_id.split(";")
        const interaction = this.interactions.find(i => i.name == args[0])
        if(!interaction) return
        const component = new Oceanic.ComponentInteraction(data as unknown as Oceanic.RawMessageComponentInteraction, this.client)
        if(component.data.componentType == 2 && interaction.type == "button") {
            interaction.run(new InteractionContext(component))
        }
        else if([3, 4, 5, 6, 7, 8].includes(component.data.componentType) && interaction.type == "menu") {
            interaction.run(new InteractionContext(component))
        }
    }

    async runCommand(data: APIApplicationCommandInteraction) {
        const i = new Oceanic.CommandInteraction(data as unknown as Oceanic.RawApplicationCommandInteraction, this.client)
        const content = [i.data.name].concat(i.data.options.getSubCommand() || []) as string[]
        const command = this.getCommand(content)
        if(!command) return
        const ctx = new CommandContext(i)
        ctx.args = this.createCommandArgs(command, i)
        command.run(ctx)
    }

    async runModalSubmit(data: APIModalSubmitInteraction) {
        const i = new Oceanic.ModalSubmitInteraction(data as unknown as Oceanic.RawModalSubmitInteraction, this.client)
        const args = data.data.custom_id.split(";")
        const interaction = this.interactions.find(i => i.name == args[0])
        if(!interaction) return
        interaction.run(new InteractionContext(i))
    }
    
    async runAutoComplete(data: APIApplicationCommandAutocompleteInteraction) {
        const i = new Oceanic.AutocompleteInteraction(data as unknown as Oceanic.RawAutocompleteInteraction, this.client)
        const focused = ([i.data.name]
            .concat(
                i.data.options.getSubCommand() || [], 
                i.data.options.getFocused()?.name || [])
            )
            .join(" ")

        const autocomplete = this.internalCacheAutocomplete.get(focused)
        if(autocomplete) autocomplete(i)
    }
}