import * as Oceanic from "oceanic.js"

export type InteractionTypes = {
    button: Oceanic.ComponentInteraction<Oceanic.ComponentTypes.BUTTON>
    menu: Oceanic.ComponentInteraction<Oceanic.ComponentTypes.STRING_SELECT>
    modal: Oceanic.ModalSubmitInteraction
}

export type Interaction<T extends keyof InteractionTypes> = {
    name: string
    type: T
    run(ctx: InteractionContext<T>): Promise<unknown>
}

export type AnyInteraction = Interaction<"button"> | Interaction<"menu"> | Interaction<"modal">

export class InternalInteraction {
    data: AnyInteraction
    
    constructor(data: AnyInteraction) {
        this.data = data
    }
}

export class InteractionContext<T extends keyof InteractionTypes> {
    userCreatorInteraction: string
    customID: string
    args: string[]
    data: InteractionTypes[T]

    constructor(interaction: InteractionTypes[T]) {
        this.data = interaction
        this.userCreatorInteraction = interaction.message?.interactionMetadata?.user.id || interaction.user.id || ""
        
        const args = interaction.data.customID.split(";")
        this.customID = args[0]
        args.shift()
        this.args = args
    }

    getData(id: string) {
        const parser = this.args.find(i => i.startsWith(id))
        return parser?.split(":")[1]
    }
}

export function createInteraction(data: AnyInteraction) {
    return new InternalInteraction(data)
}