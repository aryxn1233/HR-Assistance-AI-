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
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordHash',
        'role',
        'firstName',
        'lastName',
        'avatarUrl',
      ], // Explicitly select password
    });

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
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
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async register(registrationData: any) {
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    const newUser = this.usersRepository.create({
      ...registrationData,
      passwordHash: hashedPassword,
    });
    const savedUser = (await this.usersRepository.save(
      newUser,
    )) as unknown as User;
    const { passwordHash, ...result } = savedUser;
    return result;
  }

  async syncClerkUser(data: any): Promise<User | null> {
    // Find existing user by Clerk ID (passed as data.id from the strategy)
    if (!data.id) return null;

    let user = await this.usersRepository.findOne({
      where: { clerkId: data.id },
    });

    // If not found by clerkId, try to find by email and link them mapping legacy users
    if (!user && data.email_addresses?.[0]?.email_address) {
      const email = data.email_addresses[0].email_address;
      user = await this.usersRepository.findOne({ where: { email } });
      if (user) {
        user.clerkId = data.id;
        await this.usersRepository.save(user);
      }
    }

    const userData: Partial<User> = {
      clerkId: data.id,
      firstName: data.first_name || data.firstName || '',
      lastName: data.last_name || data.lastName || '',
      avatarUrl:
        data.image_url || data.avatarUrl || data.profile_image_url || null,
    };

    // Only update email if it was provided
    const email = data.email || data.email_addresses?.[0]?.email_address;
    if (email) {
      userData.email = email;
    }

    if (!user) {
      // Default to candidate if not specified
      const role =
        data.public_metadata?.role || data.role || UserRole.CANDIDATE;
      // Generate a dummy email if none is provided to satisfy the unique constraint
      const finalEmail = userData.email || `${data.id}@clerk.local`;
      user = this.usersRepository.create({
        clerkId: data.id,
        email: finalEmail,
        firstName: userData.firstName,
        lastName: userData.lastName,
        avatarUrl: userData.avatarUrl,
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
      select: ['id', 'passwordHash'],
    });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(data.oldPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid old password');

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
    await this.usersRepository.update(userId, {
      passwordHash: hashedNewPassword,
    });
    return { message: 'Password updated successfully' };
  }
}
