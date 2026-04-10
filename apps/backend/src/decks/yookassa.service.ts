import { randomUUID } from 'node:crypto';
import { ApiError } from '../common/response';
import { env } from '../config/env';

type YooKassaPaymentResponse = {
  id: string;
  status: string;
  amount?: {
    value?: string;
    currency?: string;
  };
  confirmation?: {
    confirmation_url?: string;
  };
  metadata?: {
    deckId?: string;
    telegramId?: string;
  };
};

function getYooKassaAuthHeader() {
  if (!env.YOOKASSA_SHOP_ID || !env.YOOKASSA_SECRET_KEY) {
    throw new ApiError(500, 'YOOKASSA_NOT_CONFIGURED');
  }

  const raw = `${env.YOOKASSA_SHOP_ID}:${env.YOOKASSA_SECRET_KEY}`;
  return `Basic ${Buffer.from(raw).toString('base64')}`;
}

export class YooKassaService {
  public async createPayment(payload: {
    amountRub: number;
    description: string;
    returnUrl: string;
    metadata: { deckId: string; telegramId: string };
  }): Promise<{ paymentId: string; confirmationUrl: string }> {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: getYooKassaAuthHeader(),
        'Content-Type': 'application/json',
        'Idempotence-Key': randomUUID(),
      },
      body: JSON.stringify({
        amount: {
          value: payload.amountRub.toFixed(2),
          currency: 'RUB',
        },
        capture: true,
        description: payload.description,
        confirmation: {
          type: 'redirect',
          return_url: payload.returnUrl,
        },
        metadata: payload.metadata,
      }),
    });

    if (!response.ok) {
      throw new ApiError(502, 'YOOKASSA_CREATE_PAYMENT_FAILED');
    }

    const data = (await response.json()) as YooKassaPaymentResponse;
    if (!data.id || !data.confirmation?.confirmation_url) {
      throw new ApiError(502, 'YOOKASSA_INVALID_CREATE_RESPONSE');
    }

    return {
      paymentId: data.id,
      confirmationUrl: data.confirmation.confirmation_url,
    };
  }

  public async getPayment(paymentId: string): Promise<YooKassaPaymentResponse> {
    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: getYooKassaAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new ApiError(502, 'YOOKASSA_GET_PAYMENT_FAILED');
    }

    return (await response.json()) as YooKassaPaymentResponse;
  }
}
