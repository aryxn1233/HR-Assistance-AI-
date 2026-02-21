import { Controller, Post, UseGuards } from '@nestjs/common';
import { HeyGenService } from './heygen.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('heygen')
export class HeyGenController {
    constructor(private readonly heygenService: HeyGenService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('token')
    async getToken() {
        const token = await this.heygenService.createToken();
        return { token };
    }
}
