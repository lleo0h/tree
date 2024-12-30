import { Client } from "./structures/Client.js"

export const client = new Client(process.env.APPLICATION_TOKEN as string)