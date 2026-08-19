import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(@Req() req: any) {
    return this.notificationService.listForUser(req.user.id);
  }

  @Post('read-all')
  async markAllRead(@Req() req: any) {
    return this.notificationService.markAllRead(req.user.id);
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationService.markRead(id, req.user.id);
  }
}
