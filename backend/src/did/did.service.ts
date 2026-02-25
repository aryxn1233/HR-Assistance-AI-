import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DIdService {
    private readonly apiKey: string | undefined;
    private readonly baseUrl = 'https://api.d-id.com';

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('DID_API_KEY');
    }

    private getHeaders() {
        return {
            Authorization: `Basic ${this.apiKey}`,
            'Content-Type': 'application/json',
            accept: 'application/json',
        };
    }

    async createSession(sourceUrl: string) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/talks/streams`,
                { source_url: sourceUrl },
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('D-ID CreateSession Error:', error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.message || 'Failed to create D-ID stream session',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async startStream(streamId: string, sessionId: string, answer: any) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/talks/streams/${streamId}/sdp`,
                { answer, session_id: sessionId },
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('D-ID StartStream Error:', error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.message || 'Failed to start D-ID stream',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async submitIceCandidate(streamId: string, sessionId: string, candidate: any) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/talks/streams/${streamId}/ice`,
                { candidate, session_id: sessionId },
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('D-ID SubmitIce Error:', error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.message || 'Failed to submit ICE candidate',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async speak(sessionId: string, streamId: string, text: string) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/talks/streams/${streamId}`,
                {
                    script: {
                        type: 'text',
                        subtitles: 'false',
                        provider: {
                            type: 'microsoft',
                            voice_id: 'en-US-AndrewNeural'
                        },
                        ssml: 'false',
                        input: text,
                    },
                    config: {
                        fluent: 'false',
                        pad_audio: '0.0',
                    },
                    session_id: sessionId,
                },
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('D-ID Speak Error:', error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.message || 'Failed to trigger D-ID speech',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async closeSession(streamId: string, sessionId: string) {
        try {
            await axios.delete(
                `${this.baseUrl}/talks/streams/${streamId}`,
                {
                    data: { session_id: sessionId },
                    headers: this.getHeaders()
                }
            );
        } catch (error) {
            console.error('D-ID CloseSession Error:', error.response?.data || error.message);
        }
    }
}
