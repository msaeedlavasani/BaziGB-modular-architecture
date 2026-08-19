import { BadRequestException, Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

/** Fallback values shown before the admin edits the footer (or on error). */
const FOOTER_DEFAULTS = {
  tagline: 'همه‌ی بازی‌ها، توی جیبت',
  links: [] as { label: string; href: string }[],
  copyright: '© 2026 BaziGB',
};

@Controller()
export class SiteSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Read one setting as a parsed object ({} when missing/invalid). */
  private async getSetting(key: string): Promise<Record<string, unknown>> {
    const row = await this.prisma.siteSetting.findUnique({ where: { key } });
    if (!row) return {};
    try {
      const parsed = JSON.parse(row.value) as unknown;
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  /**
   * Public — current site settings (footer content etc.). The web app polls
   * this on load so admin edits appear without a redeploy.
   */
  @Get('site-settings')
  async getPublic() {
    const footer = {
      ...FOOTER_DEFAULTS,
      ...(await this.getSetting('footer')),
    };
    return { footer };
  }

  /** Admin-only — upsert one site setting (e.g. key: "footer"). */
  @Patch('admin/site-settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('ADMIN')
  async update(@Body() body: { key?: string; value?: unknown }) {
    const key = typeof body?.key === 'string' ? body.key.trim() : '';
    if (!key || key.length > 50) {
      throw new BadRequestException('Invalid settings key');
    }
    const value =
      body?.value && typeof body.value === 'object'
        ? (body.value as Record<string, unknown>)
        : {};
    await this.prisma.siteSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
    return { ok: true, key };
  }
}
