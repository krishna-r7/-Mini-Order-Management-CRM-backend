
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
  const topic = req.headers['x-shopify-topic'];
  const webhookId = req.headers['x-shopify-webhook-id'];

  console.log('[Shopify Webhook] Received', {
    topic,
    webhookId,
    hasRawBody: Boolean(req.rawBody),
    bodyLength: req.rawBody?.length ?? 0,
  });

  try {
    const secret = this.configService.getOrThrow<string>(
      'SHOPIFY_CLIENT_SECRET',
    );

    const hmac = req.headers['x-shopify-hmac-sha256'];
    const rawBody = req.rawBody;

    if (typeof hmac !== 'string' || !rawBody) {
      console.error('[Shopify Webhook] Missing signature or raw body');
      throw new UnauthorizedException(
        'Missing webhook signature or body',
      );
    }

    const expectedHmac = createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    const received = Buffer.from(hmac, 'utf8');
    const expected = Buffer.from(expectedHmac, 'utf8');

    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      console.error('[Shopify Webhook] Signature verification failed', {
        topic,
        webhookId,
      });
      throw new UnauthorizedException('Invalid Shopify webhook signature');
    }

    console.log('[Shopify Webhook] Signature verified', {
      topic,
      webhookId,
    });

    const order = JSON.parse(rawBody.toString('utf8'));

    if (order.id == null) {
      console.error('[Shopify Webhook] Payload has no order ID');
      throw new Error('Webhook payload has no order ID');
    }

    const shopifyOrderId = String(order.id);
    const firstName = order.customer?.first_name ?? '';
    const lastName = order.customer?.last_name ?? '';
    const customerName = `${firstName} ${lastName}`.trim() || null;

    console.log('[Shopify Webhook] Saving order', {
      topic,
      webhookId,
      shopifyOrderId,
      orderNumber: order.name ?? order.order_number,
    });

    const savedOrder = await this.prisma.order.upsert({
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

    console.log('[Shopify Webhook] Order saved successfully', {
      topic,
      webhookId,
      shopifyOrderId,
      databaseOrderId: savedOrder.id,
    });

    return savedOrder;
  } catch (error) {
    console.error('[Shopify Webhook] Processing failed', {
      topic,
      webhookId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

}
