import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from '../common/admin.guard';

@Module({
  imports: [AuthModule, RoomsModule],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
