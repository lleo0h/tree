import * as Oceanic from "oceanic.js"
import { Client } from "../structures/Client.js"

export type CommandArgument = Omit<Oceanic.ApplicationCommandOptionBase, "required"> & {
    /*
        add conditional types
        channel, autocomplete and outhers
    */
    required?: {
        message: string
    }
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
    component?: boolean
    run(ctx: CommandContext<T>): Promise<Oceanic.Message>
}

export interface Group extends Omit<Oceanic.CreateChatInputApplicationCommandOptions, "type"> {
    type: "group"
    commands: Map<string, AnyCommand<CommandArguments>>
}

export type AnyCommand<T extends CommandArguments> = Command<T> | Group

export type AnyDataCommand<T extends CommandArguments> = Command<T> | Omit<Group, "commands">

export type GetTypeFromCommandArgument<T extends CommandArgument> = T["type"] extends keyof CommandArgumentTypes ? (T["required"] extends true ? CommandArgumentTypes[T["type"]] : CommandArgumentTypes[T["type"]] | undefined) : never

export class CommandContext<T extends CommandArguments> {
    data: Oceanic.CommandInteraction | Oceanic.ComponentInteraction //change type
    client: Client
    args = {} as {
        [K in keyof T]: GetTypeFromCommandArgument<T[K]>
    }

    constructor(data: Oceanic.CommandInteraction | Oceanic.ComponentInteraction) {
        this.data = data
        this.client = this.data.client as Client
    }

    async reply(content: string | Oceanic.InteractionContent & { embed?: Oceanic.EmbedOptions }): Promise<Oceanic.Message> {
        if(typeof content == "string") content = { content }
        if(content.embed) content.embeds ? content.embeds.push(content.embed) : content.embeds = [content.embed]
        return (
            await this.data.reply(content)
        ).getMessage()
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