import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // No lanzar excepción si no hay usuario o hay un error
    // Simplemente continuar sin usuario autenticado
    return user || null;
  }
}