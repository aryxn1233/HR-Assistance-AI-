import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InterviewsService } from './interviews.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class InterviewsGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly interviewsService: InterviewsService) { }

    @SubscribeMessage('joinInterview')
    handleJoinInterview(@MessageBody() data: { interviewId: string }, @ConnectedSocket() client: Socket) {
        client.join(data.interviewId);
        return { event: 'joined', message: `Joined interview ${data.interviewId}` };
    }

    @SubscribeMessage('sendAudio')
    handleAudio(@MessageBody() data: { interviewId: string; audioChunk: any }) {
        // Process audio (send to Whisper service placeholder)
        this.server.to(data.interviewId).emit('audioReceived', { status: 'processing' });
    }
}
