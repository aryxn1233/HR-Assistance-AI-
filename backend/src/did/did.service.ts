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

    async getClientKey() {
        if (!this.apiKey) {
            throw new HttpException('DID_API_KEY is not configured', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            const apiBaseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3003';
            // Extract domain for allowed_domains
            const frontendUrl = apiBaseUrl.includes('localhost') ? 'http://localhost:3000' : apiBaseUrl;

            const response = await axios.post(
                `${this.baseUrl}/agents/client-key`,
                {
                    allowed_domains: [
                        'localhost',
                        '127.0.0.1',
                        frontendUrl.replace(/^https?:\/\//, '').split(':')[0]
                    ],
                },
                {
                    headers: {
                        Authorization: `Basic ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching D-ID client key:', error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.message || 'Failed to fetch D-ID client key',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
