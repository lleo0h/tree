import * as Oceanic from "oceanic.js"

export type CommandArgument = Oceanic.ApplicationCommandOptionBase & {
    /*
        add conditional types
        channel, autocomplete and outhers
    */
    autocomplete?: (i: Oceanic.AutocompleteInteraction) => Promise<unknown>
}

export type CommandArguments = { [key: string]: CommandArgument }

export type CommandArgumentTypes = {
    3: string
    10: number
    6: Oceanic.User
}

export interface Command<T extends CommandArguments> extends Omit<Oceanic.CreateChatInputApplicationCommandOptions, "type"> {
    args: T
    type: "command"
    run(ctx: CommandContext<T>): Promise<Oceanic.MessageInteractionResponse<Oceanic.CommandInteraction<Oceanic.AnyInteractionChannel | Oceanic.Uncached, Oceanic.ApplicationCommandTypes>>>
}

export interface Group extends Omit<Oceanic.CreateChatInputApplicationCommandOptions, "type"> {
    type: "group"
    commands: Map<string, AnyCommand<CommandArguments>>
}

export type AnyCommand<T extends CommandArguments> = Command<T> | Group

export type AnyDataCommand<T extends CommandArguments> = Command<T> | Omit<Group, "commands">

export type GetTypeFromCommandArgument<T extends CommandArgument> = T["type"] extends keyof CommandArgumentTypes ? (T["required"] extends true ? CommandArgumentTypes[T["type"]] : CommandArgumentTypes[T["type"]] | undefined) : never

export class CommandContext<T extends CommandArguments> {
    data: Oceanic.CommandInteraction
    args = {} as {
        [K in keyof T]: GetTypeFromCommandArgument<T[K]>
    }

    constructor(data: Oceanic.CommandInteraction) {
        this.data = data
    }

    async reply(content: string | Oceanic.InteractionContent) {
        if(typeof content == "string") content = { content }
        return this.data.reply(content)
    }
}

export function createCommand<T extends CommandArguments>(data: AnyDataCommand<T>): AnyCommand<T> {
    if(data.type == "group") {
        return {
            ...data,
            commands: new Map()
        }
    }
    return data
}