import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';

@WebSocketGateway({ namespace: '/recruiter-monitor', cors: true })
export class LiveInterviewGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveInterviewGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to monitor gateway: ${client.id}`);
    const token = client.handshake.auth?.token;
    this.logger.debug(`Connection auth token present: ${!!token}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from monitor gateway: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { interviewId: string; role: 'candidate' | 'recruiter' },
  ) {
    const room = `interview:${data.interviewId}`;
    client.join(room);
    this.logger.log(`${data.role} (${client.id}) joined room: ${room}`);
    return { event: 'joined', room };
  }

  // --- WEBRTC SIGNALING ---

  @SubscribeMessage('candidate-offer')
  handleCandidateOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { interviewId: string; offer: any },
  ) {
    this.logger.debug(
      `Relaying WebRTC Offer for interview ${data.interviewId}`,
    );
    client
      .to(`interview:${data.interviewId}`)
      .emit('candidate-offer', { offer: data.offer });
  }

  @SubscribeMessage('recruiter-answer')
  handleRecruiterAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { interviewId: string; answer: any },
  ) {
    this.logger.debug(
      `Relaying WebRTC Answer for interview ${data.interviewId}`,
    );
    client
      .to(`interview:${data.interviewId}`)
      .emit('recruiter-answer', { answer: data.answer });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { interviewId: string; candidate: any },
  ) {
    this.logger.debug(
      `Relaying ICE Candidate for interview ${data.interviewId}`,
    );
    client
      .to(`interview:${data.interviewId}`)
      .emit('ice-candidate', { candidate: data.candidate });
  }

  // --- BROADCAST HELPERS FOR SERVICES ---

  broadcastInterviewStarted(data: any) {
    this.logger.log(`Broadcasting interview started: ${data.interviewId}`);
    if (!this.server) {
      this.logger.error('Socket.io server NOT initialized in LiveInterviewGateway!');
      return;
    }
    this.server.emit('interview:started', data);
  }

  broadcastQuestion(interviewId: string, text: string) {
    this.logger.debug(`Broadcasting question to interview:${interviewId}`);
    this.server
      .to(`interview:${interviewId}`)
      .emit('interview:question', { text, timestamp: new Date() });
  }

  broadcastAnswer(interviewId: string, text: string) {
    this.logger.debug(`Broadcasting answer to interview:${interviewId}`);
    this.server
      .to(`interview:${interviewId}`)
      .emit('interview:answer', { text, timestamp: new Date() });
  }

  broadcastStatus(interviewId: string, status: string) {
    this.server
      .to(`interview:${interviewId}`)
      .emit('interview:status', { status, timestamp: new Date() });
  }

  broadcastTermination(interviewId: string, reason: string, message: string) {
    this.server.to(`interview:${interviewId}`).emit('interview:terminated', {
      interviewId,
      reason,
      message,
      timestamp: new Date(),
    });
  }
}
