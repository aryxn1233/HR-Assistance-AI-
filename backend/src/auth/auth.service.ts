import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'passwordHash', 'role', 'firstName', 'lastName', 'avatarUrl'] // Explicitly select password
        });

        if (user && await bcrypt.compare(pass, user.passwordHash)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(registrationData: any) {
        const hashedPassword = await bcrypt.hash(registrationData.password, 10);
        const newUser = this.usersRepository.create({
            ...registrationData,
            passwordHash: hashedPassword,
        });
        const savedUser = await this.usersRepository.save(newUser) as unknown as User;
        const { passwordHash, ...result } = savedUser;
        return result;
    }

    async updateUser(userId: string, data: any) {
        await this.usersRepository.update(userId, data);
        return this.usersRepository.findOne({ where: { id: userId } });
    }
}
