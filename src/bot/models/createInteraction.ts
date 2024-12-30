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
    args: string[]
    data: InteractionTypes[T]

    constructor(interaction: InteractionTypes[T], args: string[]) {
        this.data = interaction
        this.args = args
    }
}

export function createInteraction(data: AnyInteraction) {
    return new InternalInteraction(data)
}