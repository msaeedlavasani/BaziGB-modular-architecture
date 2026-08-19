import { createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const SALT_ROUNDS = 10;

// OTP policy
const OTP_TTL_MS = 5 * 60 * 1000; // code valid for 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60s between sends per phone
const OTP_MAX_ATTEMPTS = 3; // wrong guesses before the code is void

/** Usernames are Latin-only per product decision (3-20 chars, A-Z a-z 0-9 _). */
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;

/** Normalize an Iranian mobile number to `09xxxxxxxxx` (throws when invalid). */
export function normalizePhone(raw: string): string {
  let p = (raw || '').replace(/\D/g, '');
  if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  if (!/^09\d{9}$/.test(p)) {
    throw new BadRequestException('شماره موبایل معتبر نیست');
  }
  return p;
}

function hashOtp(phone: string, code: string): string {
  return createHash('sha256').update(`${phone}:${code}:bazigb-otp`).digest('hex');
}

@Injectable()
export class AuthService {
  /** phone -> last request timestamp (in-memory resend cooldown). */
  private readonly otpRequestCooldowns = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sms: SmsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deactivated) {
      throw new UnauthorizedException('حساب شما غیرفعال شده است');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  /**
   * Request a one-time SMS verification code for `phone`. Replaces any
   * previous code for that phone; the code itself is stored hashed and sent
   * through SmsService (sms.ir when configured, console log in dev mode).
   */
  async requestOtp(dto: OtpRequestDto) {
    const phone = normalizePhone(dto.phone);
    const now = Date.now();

    const last = this.otpRequestCooldowns.get(phone);
    if (last && now - last < OTP_RESEND_COOLDOWN_MS) {
      throw new HttpException(
        'لطفاً ۶۰ ثانیه صبر کنید و دوباره تلاش کنید',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.prisma.otpCode.deleteMany({ where: { phone } });
    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash: hashOtp(phone, code),
        expiresAt: new Date(now + OTP_TTL_MS),
      },
    });

    await this.sms.sendVerifyCode(phone, code);
    this.otpRequestCooldowns.set(phone, now);

    return { sent: true, expiresIn: OTP_TTL_MS / 1000 };
  }

  /**
   * Verify the code for `phone`. Existing user -> login (JWT). New phone ->
   * creates the account, requiring a Latin-only `username` (the profile info
   * the user enters after receiving the OTP).
   */
  async verifyOtp(dto: OtpVerifyDto) {
    const phone = normalizePhone(dto.phone);

    const record = await this.prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('کد منقضی شده است — دوباره درخواست دهید');
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await this.prisma.otpCode.delete({ where: { id: record.id } });
      throw new UnauthorizedException('تعداد تلاشها بیش از حد مجاز بود — دوباره درخواست دهید');
    }
    if (hashOtp(phone, dto.code) !== record.codeHash) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });
      throw new UnauthorizedException('کد نادرست است');
    }

    // NOTE: the OTP record is NOT deleted here — for a brand-new phone the
    // first verify returns { isNewUser: true } so the client can collect the
    // username; the follow-up verify (same phone + code + username) must still
    // succeed. The record is deleted only after the account exists.

    let user = await this.prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;

    if (!user) {
      const username = dto.username?.trim() ?? '';
      if (!USERNAME_REGEX.test(username)) {
        // New phone + no (valid) username yet: do NOT error out — tell the
        // client this is a signup so it can show the username form. The code
        // has already been validated & consumed above, so a follow-up verify
        // with the same phone+code would fail — instead the client re-sends
        // the code or we keep the code valid by NOT deleting it here. We keep
        // it simple: respond isNewUser and let the client re-verify.
        return { isNewUser: true };
      }
      const taken = await this.prisma.user.findUnique({ where: { username } });
      if (taken) {
        throw new ConflictException('این یوزرنیم قبلاً استفاده شده است');
      }
      user = await this.prisma.user.create({
        data: { phone, username },
      });
      isNewUser = true;
    } else if (user.deactivated) {
      throw new UnauthorizedException('حساب شما غیرفعال شده است');
    }

    // Account exists / was just created -> consume the OTP code now.
    await this.prisma.otpCode.delete({ where: { id: record.id } });

    const auth = await this.buildAuthResponse(user);
    return { ...auth, isNewUser };
  }

  /**
   * Change the account password. Accounts that already have a password
   * (email/register users) must supply the correct current password; phone-OTP
   * accounts without a password can set one directly.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('کاربر یافت نشد');
    }

    if (user.password) {
      const matches = await bcrypt.compare(dto.currentPassword ?? '', user.password);
      if (!matches) {
        throw new UnauthorizedException('رمز فعلی اشتباه است');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { ok: true };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    if (!USERNAME_REGEX.test(dto.username)) {
      throw new BadRequestException(
        'نام کاربری معتبر نیست — ۳ تا ۲۰ کاراکتر لاتین (حروف، عدد، _)',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing && existing.id !== userId) {
      throw new ConflictException('این یوزرنیم قبلاً استفاده شده است');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { username: dto.username },
    });

    const { password: _p, ...safe } = updated;
    return safe;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('کاربر یافت نشد');
    const { password: _p, ...safe } = user;
    return { ...safe, hasPassword: !!user.password };
  }

  async validateUser(payload: { sub: string }) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub, deactivated: false },
    });
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string | null;
    phone: string | null;
    username: string;
    role: string;
    deactivated: boolean;
    createdAt: Date;
    password: string | null;
  }) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      role: user.role,
    });

    const { password: _password, ...safeUser } = user;
    return { accessToken, user: { ...safeUser, hasPassword: !!user.password } };
  }

  verify(token: string): { sub: string; email?: string; phone?: string; role: string } {
    return this.jwt.verify(token);
  }
}
