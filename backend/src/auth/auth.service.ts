import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from './user.entity';
import { Candidate } from '../candidates/candidate.entity';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class AuthService {
  private clerkClient;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Candidate)
    private candidatesRepository: Repository<Candidate>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.clerkClient = createClerkClient({
      secretKey: configService.get<string>('CLERK_SECRET_KEY')
    });
  }

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
    const { id: clerkId } = data;
    if (!clerkId) {
      console.warn('[ClerkSync] No Clerk ID provided in data');
      return null;
    }

    let email = data.email || data.email_addresses?.[0]?.email_address;
    let firstName = data.first_name || data.firstName || '';
    let lastName = data.last_name || data.lastName || '';
    let publicMetadata = data.public_metadata || {};

    // If email is missing (common with Clerk JWTs), fetch full user from Clerk API
    if (!email) {
      try {
        console.log(`[ClerkSync] Email missing in payload. Fetching full user from Clerk API for ${clerkId}`);
        const clerkUser = await this.clerkClient.users.getUser(clerkId);
        email = clerkUser.emailAddresses?.[0]?.emailAddress;
        firstName = clerkUser.firstName || firstName;
        lastName = clerkUser.lastName || lastName;
        publicMetadata = clerkUser.publicMetadata || publicMetadata;
        console.log(`[ClerkSync] Fetched email from Clerk API: ${email}`);
      } catch (err) {
        console.error(`[ClerkSync] Failed to fetch user from Clerk API: ${err.message}`);
      }
    }

    console.log(`[ClerkSync] Starting sync for ClerkID: ${clerkId}, Email: ${email}`);

    let user = await this.usersRepository.findOne({
      where: { clerkId: clerkId },
    });

    if (user) {
      console.log(`[ClerkSync] Found existing user by ClerkID: ${user.id}`);
    }

    // If not found by clerkId, try to find by email and link them mapping legacy users
    if (!user && email) {
      user = await this.usersRepository.findOne({ where: { email } });
      if (user) {
        console.log(`[ClerkSync] Found legacy user by email: ${email}. Linking to ClerkID: ${clerkId}`);
        user.clerkId = clerkId;
      }
    }

    const userData: Partial<User> = {
      clerkId: clerkId,
      firstName: firstName,
      lastName: lastName,
      avatarUrl: data.image_url || data.avatarUrl || data.profile_image_url || null,
      email: email || user?.email || `${clerkId}@clerk.local`,
    };

    if (!user) {
      console.log(`[ClerkSync] No user found. Creating new user record for ${userData.email}`);
      const role =
        publicMetadata?.role ||
        data.unsafe_metadata?.role ||
        data.role ||
        UserRole.CANDIDATE;

      user = this.usersRepository.create({
        ...userData,
        role: role as UserRole,
        passwordHash: 'CLERK_MANAGED',
      });
    } else {
      console.log(`[ClerkSync] Updating existing user: ${user.id}`);
      Object.assign(user, userData);
    }

    const savedUser = await this.usersRepository.save(user);
    console.log(`[ClerkSync] Successfully synchronized user: ${savedUser.email} (ID: ${savedUser.id}, Role: ${savedUser.role})`);

    // ENSURE CANDIDATE PROFILE EXISTS
    if (savedUser.role === UserRole.CANDIDATE || (savedUser.role as any) === 'candidate') {
      const candidateExists = await this.candidatesRepository.findOne({
        where: { userId: savedUser.id }
      });
      if (!candidateExists) {
        console.log(`[ClerkSync] Creating missing candidate profile for user: ${savedUser.id}`);
        const newCandidate = this.candidatesRepository.create({
          userId: savedUser.id,
          location: 'Remote',
          resumeUrl: 'pending_upload',
        });
        await this.candidatesRepository.save(newCandidate);
      }
    }

    return savedUser;
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
