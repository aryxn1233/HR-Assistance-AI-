import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'clerk']) {
    // This guard checks both strategies. Priority is given to local JWTs to prevent algorithm conflicts.
}
