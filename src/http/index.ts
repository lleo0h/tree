import fastify from "fastify"
import { route_interaction } from "./routes/discord/interactions.js"

export const server = fastify()
    .register(route_interaction) //DISCORD HTTP INTERACTION END_POINT