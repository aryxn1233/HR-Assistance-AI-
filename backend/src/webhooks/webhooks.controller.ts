import { Controller, Post, Headers, Body, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';

@Controller('webhooks')
export class WebhooksController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
    ) { }

    @Post('clerk')
    async handleClerkWebhook(
        @Headers('svix-id') svixId: string,
        @Headers('svix-timestamp') svixTimestamp: string,
        @Headers('svix-signature') svixSignature: string,
        @Body() payload: any,
        @Request() req: any,
    ) {
        const secret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');
        if (!secret) {
            console.error('CLERK_WEBHOOK_SECRET is not defined');
            throw new BadRequestException('Webhook configuration error');
        }

        // Svix needs the raw body for verification
        // In NestJS, we might need a custom parser if this fails
        // For now, we'll try with the parsed payload converted back to string
        const wh = new Webhook(secret);
        let evt: any;

        try {
            // Use the raw body for accurate Svix signature verification
            const rawBody = req.rawBody || Buffer.from(JSON.stringify(payload));
            evt = wh.verify(rawBody, {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': svixSignature,
            });
        } catch (err) {
            console.error('Webhook verification failed', err);
            throw new BadRequestException('Invalid signature');
        }

        const { data, type } = evt;
        if (type === 'user.created' || type === 'user.updated') {
            console.log(`Syncing user from Clerk event: ${type}`);
            await this.authService.syncClerkUser(data);
        }

        return { success: true };
    }
}
