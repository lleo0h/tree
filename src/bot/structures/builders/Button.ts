import * as Oceanic from "oceanic.js"

export type TextButtonBuilder = Button & {
    customID: NonNullable<Button["customID"]>
    url: undefined
}

export type URLButtonBuilder = Button & {
    customID: undefined
    url: NonNullable<Button["url"]>
    style: 5
}

export class Button {
    customID?: string
    url?: string
    disabled: boolean = false
    emoji?: Oceanic.NullablePartialEmoji
    label?: string
    style: Oceanic.ButtonStyles = 1
    type = 2

    setID(id: string) {
        this.customID = id
        this.url = undefined
        if(this.style === 5) this.style = 1
        return this as TextButtonBuilder
    }

    setURL(url: string) {
        this.customID = undefined
        this.url = url
        this.style = 5
        return this as URLButtonBuilder
    }

    setDisabled(disabled = true) {
        this.disabled = disabled
        return this
    }

    setEmoji(emoji: string | Oceanic.NullablePartialEmoji) {
        if(typeof emoji === "string") this.emoji = { name: emoji }
        else this.emoji = emoji
        return this
    }

    setLabel(label: string) {
        this.label = label
        return this
    }

    setStyle(style: keyof typeof Oceanic.ButtonStyles) {
        this.style = Oceanic.ButtonStyles[style]
        return this
    }
}