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
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl
            }
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

    async syncClerkUser(data: any) {
        const email = data.email || data.email_addresses?.[0]?.email_address;
        if (!email) return null;

        let user = await this.usersRepository.findOne({ where: { email } });

        const userData = {
            email: email,
            firstName: data.first_name || data.firstName || '',
            lastName: data.last_name || data.lastName || '',
            avatarUrl: data.image_url || data.avatarUrl || data.profile_image_url || null,
        };

        if (!user) {
            // Default to candidate if not specified
            const role = data.public_metadata?.role || data.role || UserRole.CANDIDATE;
            user = this.usersRepository.create({
                ...userData,
                role: role as UserRole,
                passwordHash: 'CLERK_MANAGED',
            });
        } else {
            // Update existing user with latest info
            Object.assign(user, userData);
        }

        return this.usersRepository.save(user);
    }

    async updateUser(userId: string, data: any) {
        await this.usersRepository.update(userId, data);
        return this.usersRepository.findOne({ where: { id: userId } });
    }
    async changePassword(userId: string, data: any) {
        if (!data.oldPassword || !data.newPassword) {
            throw new UnauthorizedException('Current and new password are required');
        }

        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'passwordHash']
        });
        if (!user) throw new UnauthorizedException('User not found');

        const isMatch = await bcrypt.compare(data.oldPassword, user.passwordHash);
        if (!isMatch) throw new UnauthorizedException('Invalid old password');

        const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
        await this.usersRepository.update(userId, { passwordHash: hashedNewPassword });
        return { message: 'Password updated successfully' };
    }
}
