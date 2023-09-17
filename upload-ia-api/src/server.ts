import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors'
import { prisma } from "./lib/prisma";
import { getAllPrompts } from "./routes/get-all-prompts";
import { uploadVideoRoute } from "./routes/upload-video";
import { createTranscritionRoute } from "./routes/create-trasncription";
import { generateIaCompletionRoute } from "./routes/generate-ai-completion";

const app = fastify()

app.register(fastifyCors, {
    origin: '*',
})

app.register(getAllPrompts)
app.register(uploadVideoRoute)
app.register(createTranscritionRoute)
app.register(generateIaCompletionRoute)

app.listen({
    port: 3333,
}).then(() => {
    console.log('HTTP server running')
})