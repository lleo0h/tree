import * as Oceanic from "oceanic.js"

export class Embed {
    title?: string
    description?: string
    type: Oceanic.EmbedType = "rich"
    url?: string
    color?: number
    timestamp?: string
    image?: Oceanic.EmbedImage
    footer?: Oceanic.EmbedFooter
    author?: Oceanic.EmbedAuthor
    fields: Oceanic.EmbedField[] = []
    thumbnail?: Oceanic.EmbedImageOptions

    setAuthor(name: string, iconURL?: string, url?: string) {
        this.author = { name, iconURL, url }
        return this
    }

    setTitle(title: string) {
        this.title = title
        return this
    }

    setDescription(description: string) {
        this.description = description
        return this
    }

    setImage(url: string, height?: number, width?: number) {
        this.image = { url, height, width }
        return this
    }

    setURL(url: string) {
        this.url = url
        return this
    }

    setColor(color: string) {
        this.color = parseInt(color.toUpperCase().replace("#", ""), 16)
        return this
    }

    setType(type: Oceanic.EmbedType) {
        this.type = type
        return this
    }

    setThumbnail(url: string) {
        this.thumbnail = { url }
        return this
    }

    addField({ name, value, inline }: Oceanic.EmbedField) {
        this.fields.push({ name, value, inline })
        return this
    }

    setFooter(text: string, iconURL?: string) {
        this.footer = { text, iconURL }
        return this
    }

    setTimestamp() {
        this.timestamp = String(Date.now())
        return this
    }
}