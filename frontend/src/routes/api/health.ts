/*
 * ©AngelaMos | 2025
 * health.ts
 */

import { type APIEvent } from '@solidjs/start/server';

export function GET(_event: APIEvent): Response {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'frontend',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
