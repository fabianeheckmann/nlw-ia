import { Label } from "@radix-ui/react-label";
import { Separator } from "@radix-ui/react-separator";
import { FileVideo, Upload } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFfmpeg } from "@/lib/ffmpeg";

import { fetchFile } from '@ffmpeg/util'
import { blob } from "stream/consumers";
import React from "react";

export function VideoInputForm() {
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const promptInputRef = useRef<HTMLTextAreaElement>(null)
    const [status, setStatus] = useState('waiting')

    function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
        const { files } = event.currentTarget

        if (!files) {
            return
        }

        const selectedFile = files[0]
        setVideoFile(selectedFile)
    }

    async function convertVideoToAudio(video: File) {
        console.log('covert video started...')

        const ffmpeg = await getFfmpeg()

        await ffmpeg.writeFile('input.mp4', await fetchFile(video))

        // ffmpeg.on('log', log => { console.log(log)})

        ffmpeg.on("progress", progress => {
            console.log('convert progress: ' + Math.round(progress.progress * 100))
        })
        await ffmpeg.exec([
            '-1',
            'input.mp4',
            '-map',
            '0:a',
            '-b:a',
            '20k',
            '-acodec',
            'libmp3lame',
            'output.mp3'
        ])
        const data = await ffmpeg.readFile('output.mp3')
        const audioFileBlob = new Blob([data], {type: 'audio/mpeg'})
        const audioFile = new File([audioFileBlob], 'audio.mp3', {
            type: 'audio/mpeg',
        })

        console.log('convert finished.')

        return audioFile
    }

    async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const prompt = promptInputRef.current?.value

        if(!videoFile) {
            return
        } 

        // convert video in audio
        const audioFile = await convertVideoToAudio(videoFile)
        console.log(audioFile, prompt)

        const data = new FormData()

        data.append('file', audioFile)
        // const response = await api.post('/videos', data)

        // const videoId = response.data.video.id 

        // await api.post(`/videos/${videoId}/transcription`, {
        //     prompt,
        // })
    }

    const previewUrl = useMemo(() => {
        if (!videoFile) {
            return null
        }

        return URL.createObjectURL(videoFile)

    }, [videoFile])

    return (
        <form onSubmit={handleUploadVideo} className="space-y-6">
            <label
                htmlFor="video"
                className=" relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/10"
            >
                {previewUrl ? (
                    <video src={previewUrl} controls={false} className=" pointer-events-none absolute inset-0" />
                ) : (
                    <>
                        <FileVideo className=" w-4 h-4" />
                        selecione um video
                    </>
                )}
            </label>
            <input type="file" id="video" accept="video/mp4" className=" sr-only" onChange={handleFileSelected} />

            <Separator />
            <div className=" space-y-1">
                <Label htmlFor="transcription_prompt">prompt de transcrição</Label>
                <Textarea ref={promptInputRef} id="transcription_prompt" className=" h-20 leading-relaxed resize-none" placeholder="Inclua palavras chave separadas por virgula (,) " />
            </div>
            <Button type="submit" className=" w-full">Carregar video <Upload className=" m-4 h-4 ml-2" /> </Button>
        </form>
    );
}