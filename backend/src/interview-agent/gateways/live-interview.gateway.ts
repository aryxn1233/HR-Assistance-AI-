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
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveInterviewGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to monitor gateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from monitor gateway: ${client.id}`);
  }

  @SubscribeMessage('join-interview')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { interviewId: string; role: 'candidate' | 'recruiter' },
  ) {
    const room = `interview:${data.interviewId}`;
    client.join(room);
    this.logger.log(`${data.role} joined room: ${room}`);
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
    // Send to everyone in room except sender (which targets the recruiter)
    client
      .to(`interview:${data.interviewId}`)
      .emit('candidate-offer', data.offer);
  }

  @SubscribeMessage('recruiter-answer')
  handleRecruiterAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { interviewId: string; answer: any },
  ) {
    this.logger.debug(
      `Relaying WebRTC Answer for interview ${data.interviewId}`,
    );
    // Send back to the candidate
    client
      .to(`interview:${data.interviewId}`)
      .emit('recruiter-answer', data.answer);
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
      .emit('ice-candidate', data.candidate);
  }

  // --- BROADCAST HELPERS FOR SERVICES ---

  broadcastInterviewStarted(data: any) {
    this.server.to('/recruiter-monitor').emit('interview:started', data);
  }

  broadcastQuestion(interviewId: string, question: string) {
    this.server
      .to(`interview:${interviewId}`)
      .emit('interview:question', { question, timestamp: new Date() });
  }

  broadcastAnswer(interviewId: string, question: string, answer: string) {
    this.server
      .to(`interview:${interviewId}`)
      .emit('interview:answer', { question, answer, timestamp: new Date() });
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
