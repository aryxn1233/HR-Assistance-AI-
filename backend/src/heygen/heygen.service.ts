import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HeyGenService {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.heygen.com/v1/streaming.create_token';

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('HEYGEN_API_KEY') || "";
    }

    async createToken(): Promise<string> {
        if (!this.apiKey) {
            throw new HttpException('HEYGEN_API_KEY is not configured', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            const response = await axios.post(
                this.baseUrl,
                {},
                {
                    headers: {
                        'X-Api-Key': this.apiKey,
                    },
                },
            );

            return response.data.data.token;
        } catch (error) {
            console.error('Error creating HeyGen token:', error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.message || 'Failed to create HeyGen token',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
