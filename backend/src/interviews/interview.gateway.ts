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
export class InterviewGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly interviewsService: InterviewsService) {}

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

    try {
      // Start or resume session
      const result = await this.interviewsService.startSession(
        payload.interviewId,
      );

      if (result.status === 'completed') {
        this.server.to(payload.interviewId).emit('interviewEnd', {
          message: 'Interview completed',
          report: result.report,
        });
      } else if (result.question) {
        // Send question text only to client for safety/simplicity
        this.server
          .to(payload.interviewId)
          .emit('question', { text: result.question.questionText });
      }
    } catch (error) {
      console.error(`Error joining room ${payload.interviewId}:`, error);
      client.emit('error', { message: 'Failed to join interview session' });
    }
  }

  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    client: Socket,
    payload: { interviewId: string; answer: string },
  ) {
    console.log(
      `Received answer for ${payload.interviewId}: ${payload.answer}`,
    );

    try {
      // Process answer and get next question
      const result = await this.interviewsService.submitAnswer(
        payload.interviewId,
        payload.answer,
      );

      if (result.status === 'completed') {
        this.server.to(payload.interviewId).emit('interviewEnd', {
          message: 'Interview completed',
          report: result.report,
        });
      } else if (result.question) {
        this.server
          .to(payload.interviewId)
          .emit('question', { text: result.question.questionText });
      }
    } catch (error) {
      console.error(
        `Error submitting answer for ${payload.interviewId}:`,
        error,
      );
      client.emit('error', { message: 'Failed to submit answer' });
    }
  }
}
