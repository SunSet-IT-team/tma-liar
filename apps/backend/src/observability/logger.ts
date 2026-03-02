import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

/**
 * HTTP logger with request id propagation via `x-request-id`.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const incoming = req.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && incoming ? incoming : randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
});

