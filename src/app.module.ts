import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DbconfigModule } from '@app/dbconfig';
import { AuthMiddleware } from './middlewares/auth.middleware';

@Module({
  imports: [AuthModule, DbconfigModule],
  controllers: [],
  providers: [],
})


export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: 'auth/*', method: RequestMethod.ALL });
  }
}
