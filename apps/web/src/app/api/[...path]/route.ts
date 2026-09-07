import { NextRequest, NextResponse } from 'next/server';

const allowedTargets = new Set([
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3101',
  'http://127.0.0.1:3201',
  'http://localhost:3001',
]);

function apiTarget() {
  const target = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3001';
  if (!allowedTargets.has(target)) throw new Error('Invalid API_PROXY_TARGET');
  return target;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const destination = new URL(`/api/${path.join('/')}`, apiTarget());
  destination.search = request.nextUrl.search;
  const response = await fetch(destination, {
    method: request.method,
    headers: request.headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export const dynamic = 'force-dynamic';
export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
