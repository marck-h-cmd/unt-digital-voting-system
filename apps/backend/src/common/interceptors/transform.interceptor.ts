// backend/src/common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { GqlExecutionContext } from "@nestjs/graphql";

export interface Response<T> {
  data: T;
  timestamp: string;
  path: string;
  statusCode: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const isGraphQL = context.getType<string>() === "graphql";
    
    if (isGraphQL) {
      // Skip wrapping GraphQL responses - Apollo needs the raw format
      return next.handle();
    }

    let path = "";
    let statusCode = 200;
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    path = request.url || "";
    statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => ({
        data,
        timestamp: new Date().toISOString(),
        path,
        statusCode,
      })),
    );
  }
}
