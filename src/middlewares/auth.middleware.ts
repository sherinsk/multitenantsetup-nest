// src/middleware/auth.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: (err?: any) => void) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) throw new UnauthorizedException('No token provided');

      const token = authHeader.split(' ')[1]; // Bearer <token>
      if (!token) throw new UnauthorizedException('Token missing');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);

      // attach user info
      (req as any).user = decoded;

      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
