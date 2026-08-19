import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SMS delivery abstraction for OTP codes.
 *
 * Two modes:
 *  - sms.ir (production): POST https://api.sms.ir/v1/send/verify using the
 *    panel API key and a "کد تایید" template (templateId). The account is
 *    currently NOT activated yet — when the API key is provided this path
 *    goes live automatically (status 13 = inactive account surfaces as an
 *    error so we notice it).
 *  - console (dev fallback): when SMSIR_API_KEY is not set, the code is only
 *    logged. This lets us build and test the whole OTP flow before the sms.ir
 *    account is activated.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string | undefined;
  private readonly templateId: number;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('SMSIR_API_KEY') || undefined;
    this.templateId = Number(this.config.get<string>('SMSIR_TEMPLATE_ID') || '123456');
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async sendVerifyCode(phone: string, code: string): Promise<void> {
    if (!this.apiKey) {
      // Dev mode — the sms.ir account is not activated yet. The code is only
      // visible in the server log.
      this.logger.warn(`[OTP dev-mode] verification code for ${phone}: ${code}`);
      return;
    }

    try {
      const res = await fetch('https://api.sms.ir/v1/send/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          mobile: phone,
          templateId: this.templateId,
          // Parameter name must match the template placeholder (without the
          // surrounding #). Template 997360 ("OTP") uses #OTP#.
          parameters: [{ name: 'OTP', value: code }],
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        status?: number;
        message?: string;
        data?: { messageId?: number };
      } | null;

      if (res.ok && body?.status === 1) {
        // Log the REAL messageId so delivery can be tracked on the sms.ir
        // panel / via GET /v1/send/{messageId}.
        this.logger.log(
          `OTP sent to ${phone} (messageId ${body?.data?.messageId ?? 'unknown'})`,
        );
        return;
      }
      // sms.ir status codes: 13 = account inactive, 10 = invalid key, 20 = rate limit…
      this.logger.error(
        `sms.ir verify send failed (http ${res.status}, status ${body?.status}): ${body?.message ?? 'unknown'}`,
      );
      throw new Error(`SMS delivery failed (${body?.message ?? res.status})`);
    } catch (e: any) {
      if (e?.message?.startsWith('SMS delivery failed')) throw e;
      this.logger.error(`sms.ir network error: ${e?.message}`);
      throw new Error('SMS service unavailable');
    }
  }
}
