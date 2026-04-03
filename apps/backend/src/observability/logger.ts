import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

type ReqWithId = IncomingMessage & { id?: string };

/**
 * Без полных заголовков: иначе каждый запрос раздувает лог на килобайты.
 */
function slimReqSerializer(req: ReqWithId) {
  return {
    id: req.id,
    method: req.method,
    url: req.url,
  };
}

function slimResSerializer(res: ServerResponse) {
  return {
    statusCode: res.statusCode,
  };
}

/**
 * HTTP logger with request id propagation via `x-request-id`.
 */
export const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: slimReqSerializer,
    res: slimResSerializer,
  },
  genReqId(req, res) {
    const incoming = req.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && incoming ? incoming : randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
});

