
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopifyWebhookService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleOrderWebhook(req: RawBodyRequest<Request>) {
    const secret = this.configService.getOrThrow<string>(
      'SHOPIFY_CLIENT_SECRET',
    );

    const hmac = req.headers['x-shopify-hmac-sha256'];
    const rawBody = req.rawBody;

    if (!hmac || !rawBody) {
      throw new UnauthorizedException('Missing webhook signature or body');
    }

    const expectedHmac = createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    const received = Buffer.from(Array.isArray(hmac) ? hmac[0] : hmac, 'utf8'); 
    const expected = Buffer.from(expectedHmac);

    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new UnauthorizedException('Invalid Shopify webhook signature');
    }

    try {
      const order = JSON.parse(rawBody.toString('utf8'));

      const shopifyOrderId = String(order.id);
      const firstName = order.customer?.first_name ?? '';
      const lastName = order.customer?.last_name ?? '';
      const customerName =
        `${firstName} ${lastName}`.trim() || null;

      return await this.prisma.order.upsert({
        where: { shopifyOrderId },
        create: {
          shopifyOrderId,
          orderNumber: String(order.name ?? order.order_number),
          email: order.email ?? order.customer?.email ?? null,
          customerName,
          totalPrice: String(order.total_price ?? '0'),
          currency: order.currency ?? 'USD',
          financialStatus: order.financial_status ?? null,
          fulfillmentStatus: order.fulfillment_status ?? null,
          shopifyCreatedAt: order.created_at
            ? new Date(order.created_at)
            : null,
          shopifyUpdatedAt: order.updated_at
            ? new Date(order.updated_at)
            : null,
        },
        update: {
          orderNumber: String(order.name ?? order.order_number),
          email: order.email ?? order.customer?.email ?? null,
          customerName,
          totalPrice: String(order.total_price ?? '0'),
          currency: order.currency ?? 'USD',
          financialStatus: order.financial_status ?? null,
          fulfillmentStatus: order.fulfillment_status ?? null,
          shopifyCreatedAt: order.created_at
            ? new Date(order.created_at)
            : null,
          shopifyUpdatedAt: order.updated_at
            ? new Date(order.updated_at)
            : null,
        },
      });
    } catch (error) {
      if (
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to save Shopify order',
      );
    }
  }
}
