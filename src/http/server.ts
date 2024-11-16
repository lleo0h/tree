import fastify from "fastify"
import { route_interaction } from "./routes/discord/interactions.js"

export const app = fastify()
    .register(route_interaction)