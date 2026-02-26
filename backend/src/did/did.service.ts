import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as https from 'https';

@Injectable()
export class DIdService {
    private readonly apiKey: string | undefined;
    private readonly baseUrl = 'https://api.d-id.com';
    private readonly httpsAgent = new https.Agent({
        rejectUnauthorized: false, // Bypass SSL issues (e.g. self-signed certificate chain)
    });

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('DID_API_KEY');
        const keyStatus = this.apiKey ? `PRESENT (len=${this.apiKey.length}, ends with ${this.apiKey.slice(-4)})` : 'MISSING';
        console.log(`D-ID Service Initialized. Key: ${keyStatus}`);
    }

    private getHeaders() {
        // Use the apiKey directly as it is already formatted for Basic Auth (as seen in demo)
        return {
            Authorization: `Basic ${this.apiKey}`,
            'Content-Type': 'application/json',
            accept: 'application/json',
        };
    }

    async createSession(sourceUrl: string) {
        return this.requestWithRetry(() => axios.post(
            `${this.baseUrl}/talks/streams`,
            { source_url: sourceUrl, stream_warmup: true },
            {
                headers: this.getHeaders(),
                httpsAgent: this.httpsAgent
            }
        ), 'CreateSession');
    }

    async startStream(streamId: string, sessionId: string, answer: any) {
        return this.requestWithRetry(() => axios.post(
            `${this.baseUrl}/talks/streams/${streamId}/sdp`,
            { answer, session_id: sessionId },
            {
                headers: this.getHeaders(),
                httpsAgent: this.httpsAgent
            }
        ), 'StartStream');
    }

    async submitIceCandidate(streamId: string, sessionId: string, candidate: any) {
        // D-ID API expects a flat object with candidate, sdpMid, sdpMLineIndex, and session_id
        const body = candidate ? {
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
            session_id: sessionId
        } : { session_id: sessionId };

        return this.requestWithRetry(() => axios.post(
            `${this.baseUrl}/talks/streams/${streamId}/ice`,
            body,
            {
                headers: this.getHeaders(),
                httpsAgent: this.httpsAgent
            }
        ), 'SubmitIce');
    }

    async speak(sessionId: string, streamId: string, text: string) {
        return this.requestWithRetry(() => axios.post(
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
                    stitch: true,
                },
                session_id: sessionId,
            },
            {
                headers: this.getHeaders(),
                httpsAgent: this.httpsAgent
            }
        ), 'Speak');
    }

    async closeSession(streamId: string, sessionId: string) {
        try {
            await this.requestWithRetry(() => axios.delete(
                `${this.baseUrl}/talks/streams/${streamId}`,
                {
                    data: { session_id: sessionId },
                    headers: this.getHeaders(),
                    httpsAgent: this.httpsAgent
                }
            ), 'CloseSession');
        } catch (error) {
            console.error('D-ID CloseSession Error (ignored):', error.message);
        }
    }

    private async requestWithRetry(requestFn: () => Promise<any>, actionName: string, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                if (actionName === 'CreateSession') {
                    console.log(`D-ID: ${actionName} initiating...`);
                }
                const response = await requestFn();
                if (actionName === 'CreateSession') {
                    console.log(`D-ID: ${actionName} Success:`, response.data.id);
                }
                return response.data;
            } catch (error) {
                const status = error.response?.status;
                const errorData = error.response?.data;

                if (status === 429 && i < retries - 1) {
                    console.warn(`D-ID ${actionName} 429 (Rate Limit). Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                    continue;
                }

                console.error(`D-ID ${actionName} Error:`, {
                    status,
                    data: JSON.stringify(errorData),
                    message: error.message
                });

                let errorMessage = errorData?.description || errorData?.message || `Failed to perform D-ID ${actionName}`;
                if (status === 403 && errorMessage.toLowerCase().includes('max user sessions')) {
                    errorMessage = "D-ID concurrent session limit reached. Please close other active interview tabs or wait a minute for the previous session to timeout.";
                }

                throw new HttpException(
                    errorMessage,
                    status || HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }
}
