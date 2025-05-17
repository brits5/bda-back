import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // Si hay un error o no hay usuario, lanzar una excepción
    if (err || !user) {
      throw err || new UnauthorizedException('No estás autenticado');
    }
    return user;
  }
}