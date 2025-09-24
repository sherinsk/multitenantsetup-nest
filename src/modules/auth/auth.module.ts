import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { DbconfigModule } from '@app/dbconfig';

@Module({
  imports: [DbconfigModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
