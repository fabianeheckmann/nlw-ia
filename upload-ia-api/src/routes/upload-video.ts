import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";

const pump = promisify(pipeline);

export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1048576 * 25, // 25mg
    },
  });

  app.post("/video", async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: "Missing file input." });
    }

    const extension = path.extname(data.filename);

    if (extension != ".mp3") {
      return reply
        .status(400)
        .send({ error: "Invalid input type, please upload a mp3" });
    }

    const fileBasename = path.basename(data.filename, extension);
    const fileUploadName = `${fileBasename}-${randomUUID()}${extension}`;
    const uploadDestinatiom = path.resolve(
      __dirname,
      "../../tmp",
      fileUploadName
    );

    await pump(data.file, fs.createWriteStream(data.filename));

    const video = prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDestinatiom,
      }
    })

    return {
      video
    }
  });
}
