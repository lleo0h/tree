import * as Oceanic from "oceanic.js"

export const BUTTON_STYLES = {
    PRIMARY: 1,
    SECONDARY: 2,
    SUCCESS: 3,
    DANGER: 4,
    URL: 5
}

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

    addArgument(key: string, value: string) {
        this.customID+=`;${key}:${value}`
        return this
    }

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

    setStyle(style: keyof typeof BUTTON_STYLES) {
        this.style = BUTTON_STYLES[style]
        return this
    }
}