import { Module } from '@nestjs/common';
import { DbConfigService } from './services/dbconfig.service';


@Module({
  providers: [DbConfigService],
  exports: [DbConfigService],
})
export class DbconfigModule {}
