"use client"

import { Button } from "@/components/ui/button"
import { Mic, Video, VideoOff, MicOff, PhoneOff } from "lucide-react"

export function WebcamPreview() {
    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex h-full w-full items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-zinc-800 flex items-center justify-center opacity-50">
                    <VideoOff className="h-12 w-12 text-zinc-500" />
                </div>
                <div className="absolute top-4 left-4 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white animate-pulse">
                    REC
                </div>
                <div className="absolute top-4 right-4 rounded bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    00:15:32
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border-0">
                    <Mic className="h-5 w-5" />
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border-0">
                    <Video className="h-5 w-5" />
                </Button>
                <Button variant="destructive" size="icon" className="rounded-full h-12 w-12">
                    <PhoneOff className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}
