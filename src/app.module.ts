import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/controllers/auth.controller';
import { DbconfigModule } from '@app/dbconfig';

@Module({
  imports: [AuthModule, DbconfigModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
