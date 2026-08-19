import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface StoredData {
  rooms: Record<string, unknown>;
}

/**
 * سرویس پایگاه‌داده.
 * پیش‌فرض: فایل JSON محلی (data/db.json) — بدون وابستگی.
 * DB_TYPE=postgres: در نسخه بعدی با Prisma فعال می‌شود (prisma/schema.prisma).
 */
@Injectable()
export class DatabaseService {
  private readonly file = path.join(process.cwd(), 'data', 'db.json');
  private data: StoredData = { rooms: {} };

  constructor() {
    if (process.env.DB_TYPE === 'postgres') {
      // eslint-disable-next-line no-console
      console.warn('[database] DB_TYPE=postgres هنوز فعال نشده — از فایل JSON استفاده می‌شود');
    }
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    try {
      const raw = fs.readFileSync(this.file, 'utf-8');
      this.data = JSON.parse(raw) as StoredData;
    } catch {
      // اولین اجرا — فایل هنوز وجود ندارد
    }
  }

  private persist(): void {
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }

  getRoom(id: string): unknown {
    return this.data.rooms[id] ?? null;
  }

  saveRoom(room: { id: string }): void {
    this.data.rooms[room.id] = room;
    this.persist();
  }

  listRooms(): unknown[] {
    return Object.values(this.data.rooms);
  }

  deleteRoom(id: string): void {
    delete this.data.rooms[id];
    this.persist();
  }
}
