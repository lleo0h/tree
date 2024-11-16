import { TextButtonBuilder, URLButtonBuilder } from "./Button.js"

export type AnyComponentBuilder = TextButtonBuilder | URLButtonBuilder

export class ActionRow {
    type = 1
    components: AnyComponentBuilder[] = []

    addComponent(component: AnyComponentBuilder) {
        this.components.push(component)
        return this
    }

    addComponents(...components: AnyComponentBuilder[]) {
        this.components = this.components.concat(components)
        return this
    }
}