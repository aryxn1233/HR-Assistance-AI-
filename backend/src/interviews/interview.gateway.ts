import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InterviewsService } from './interviews.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class InterviewGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly interviewsService: InterviewsService) { }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(client: Socket, payload: { interviewId: string }) {
        client.join(payload.interviewId);
        console.log(`Client ${client.id} joined room ${payload.interviewId}`);

        // Retrieve current state/question
        const interview = await this.interviewsService.findOne(payload.interviewId);
        if (interview) {
            // If no history, generate first question
            if (!interview.history || interview.history.length === 0) {
                const question = await this.interviewsService.generateNextQuestion(payload.interviewId);
                this.server.to(payload.interviewId).emit('question', { text: question });
            } else {
                // Send last question if last message was AI
                const lastMessage = interview.history[interview.history.length - 1];
                if (lastMessage.role === 'ai') {
                    this.server.to(payload.interviewId).emit('question', { text: lastMessage.content });
                }
            }
        }
    }

    @SubscribeMessage('submitAnswer')
    async handleSubmitAnswer(client: Socket, payload: { interviewId: string; answer: string }) {
        console.log(`Received answer for ${payload.interviewId}: ${payload.answer}`);

        // Process answer and get next question
        const nextQuestion = await this.interviewsService.processAnswer(payload.interviewId, payload.answer);

        if (nextQuestion) {
            this.server.to(payload.interviewId).emit('question', { text: nextQuestion });
        } else {
            this.server.to(payload.interviewId).emit('interviewEnd', { message: 'Interview completed' });
        }
    }
}
