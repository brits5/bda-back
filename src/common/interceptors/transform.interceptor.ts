import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  
  export interface Response<T> {
    data: T;
    meta?: any;
  }
  
  @Injectable()
  export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>>
  {
    intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Observable<Response<T>> {
      return next.handle().pipe(
        map((data) => {
          // Si la respuesta ya tiene un formato específico, la devolvemos tal cual
          if (data && (data.data !== undefined || data.meta !== undefined)) {
            return data;
          }
  
          // Si es un objeto paginado (tiene pagination.totalItems)
          if (data && data.items && data.meta && data.meta.totalItems !== undefined) {
            return {
              data: data.items,
              meta: data.meta,
            };
          }
  
          // Para respuestas simples
          return {
            data,
          };
        }),
      );
    }
  }