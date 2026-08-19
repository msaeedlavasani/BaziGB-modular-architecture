import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SiteSettingsController } from './site-settings.controller';

@Module({
  imports: [AuthModule],
  controllers: [SiteSettingsController],
})
export class SiteSettingsModule {}
