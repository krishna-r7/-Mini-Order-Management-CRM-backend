import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopifyWebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // Handles newly created Shopify orders
  async handleOrderCreated(req: RawBodyRequest<Request>) {
    const { order, topic, webhookId } = this.verifyWebhook(req);

    if (topic !== 'orders/create') {
      throw new BadRequestException('Expected orders/create webhook');
    }

    return this.createOrder(order, webhookId);
  }

  // Handles changes to existing Shopify orders
  async handleOrderUpdated(req: RawBodyRequest<Request>) {
    const { order, topic, webhookId } = this.verifyWebhook(req);

    if (topic !== 'orders/updated') {
      throw new BadRequestException('Expected orders/updated webhook');
    }

    return this.updateOrder(order, webhookId);
  }

  private verifyWebhook(req: RawBodyRequest<Request>) {
    const topic = req.headers['x-shopify-topic'];
    const webhookId = req.headers['x-shopify-webhook-id'];
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const rawBody = req.rawBody;

    console.log('[Shopify Webhook] Received', {
      topic,
      webhookId,
      hasRawBody: Boolean(rawBody),
      bodyLength: rawBody?.length ?? 0,
    });

    if (typeof hmac !== 'string' || !rawBody) {
      throw new UnauthorizedException('Missing webhook signature or body');
    }

    const secret = this.configService.getOrThrow<string>(
      'SHOPIFY_WEBHOOK_SECRET',
    );

    const expectedHmac = createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    const received = Buffer.from(hmac, 'utf8');
    const expected = Buffer.from(expectedHmac, 'utf8');

    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new UnauthorizedException('Invalid Shopify webhook signature');
    }

    let order: any;

    try {
      order = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid webhook JSON payload');
    }

    if (order.id == null) {
      throw new BadRequestException('Webhook payload has no order ID');
    }

    return { order, topic, webhookId };
  }

  // Create handler: idempotent, so webhook retries do not duplicate orders
  private async createOrder(
    order: any,
    webhookId: string | string[] | undefined,
  ) {
    return this.saveOrderAndItems(order, webhookId, 'create');
  }

  // Update handler: synchronizes existing data and ignores older events
  private async updateOrder(
    order: any,
    webhookId: string | string[] | undefined,
  ) {
    return this.saveOrderAndItems(order, webhookId, 'update');
  }

  // Shared transactional database logic
  private async saveOrderAndItems(
    order: any,
    webhookId: string | string[] | undefined,
    operation: 'create' | 'update',
  ) {

    if (typeof webhookId !== 'string' || !webhookId.trim()) {
      throw new BadRequestException('Missing Shopify webhook ID');
    }
    const shopifyOrderId = String(order.id);

    const incomingUpdatedAt = order.updated_at
      ? new Date(order.updated_at)
      : null;

    if (incomingUpdatedAt && Number.isNaN(incomingUpdatedAt.getTime())) {
      throw new BadRequestException('Invalid order updated_at timestamp');
    }

    const firstName = order.customer?.first_name ?? '';
    const lastName = order.customer?.last_name ?? '';
    const customerName = `${firstName} ${lastName}`.trim() || null;

    const lineItems = (order.line_items ?? []).map((item: any) => {
      if (item.id == null) {
        throw new BadRequestException('Line item is missing its ID');
      }

      const quantity = Number(item.quantity);
      const price = Number(item.price ?? 0);

      if (
        !Number.isInteger(quantity) ||
        quantity < 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new BadRequestException('Invalid line item quantity or price');
      }

      return {
        shopifyLineItemId: String(item.id),
        shopifyProductId:
          item.product_id != null ? String(item.product_id) : null,
        shopifyVariantId:
          item.variant_id != null ? String(item.variant_id) : null,
        title: item.title || 'Unknown product',
        sku: item.sku || null,
        quantity,
        unitPrice: price.toFixed(2),
        totalPrice: (price * quantity).toFixed(2),
      };
    });


    const incomingCreatedAt = order.created_at
      ? new Date(order.created_at)
      : null;

    if (incomingCreatedAt && Number.isNaN(incomingCreatedAt.getTime())) {
      throw new BadRequestException('Invalid order created_at timestamp');
    }

    const orderData = {
      orderNumber: String(order.name ?? order.order_number ?? ''),
      email: order.email ?? order.customer?.email ?? null,
      customerName,
      totalPrice: String(order.total_price ?? '0'),
      currency: order.currency ?? 'USD',
      financialStatus: order.financial_status ?? null,
      fulfillmentStatus: order.fulfillment_status ?? null,
      shopifyCreatedAt: incomingCreatedAt,
      shopifyUpdatedAt: incomingUpdatedAt,
    };

    let result: {
      orderId: string;
      skipped: boolean;
      reason?: string;
    };

    try {
      result = await this.prisma.$transaction(async (tx) => {
        // 1. Register this delivery inside the same transaction.
        // The unique webhookId constraint protects concurrent duplicates.
        if (typeof webhookId === 'string' && webhookId.length > 0) {
          await tx.processedWebhook.create({
            data: {
              webhookId,
              topic:
                operation === 'create' ? 'orders/create' : 'orders/updated',
            },
          });
        }

        // 2. Check the existing order and its stored timestamp.
        const existing = await tx.order.findUnique({
          where: { shopifyOrderId },
          select: {
            id: true,
            shopifyUpdatedAt: true,
          },
        });

        // 3. Ignore older events, but commit their delivery ID as processed.
        if (
          existing?.shopifyUpdatedAt &&
          incomingUpdatedAt &&
          existing.shopifyUpdatedAt.getTime() > incomingUpdatedAt.getTime()
        ) {
          return {
            orderId: existing.id,
            skipped: true,
            reason: 'Older webhook event',
          };
        }

        // 4. Create or update the order.
        const saved = await tx.order.upsert({
          where: { shopifyOrderId },
          create: {
            shopifyOrderId,
            ...orderData,
          },
          update: orderData,
        });

        // 5. Remove line items no longer present in the payload.
        const incomingIds = lineItems.map(
          (item: (typeof lineItems)[number]) => item.shopifyLineItemId,
        );

        await tx.orderItem.deleteMany({
          where: {
            orderId: saved.id,
            ...(incomingIds.length > 0
              ? { shopifyLineItemId: { notIn: incomingIds } }
              : {}),
          },
        });

        // 6. Upsert the current line items.
        for (const item of lineItems) {
          await tx.orderItem.upsert({
            where: {
              orderId_shopifyLineItemId: {
                orderId: saved.id,
                shopifyLineItemId: item.shopifyLineItemId,
              },
            },
            create: {
              ...item,
              orderId: saved.id,
            },
            update: item,
          });
        }

        return {
          orderId: saved.id,
          skipped: false,
        };
      });
    } catch (error: unknown) {
      // A concurrent delivery may win the unique webhookId insert.
      const dbError = error as {
        code?: string;
        meta?: { target?: unknown };
      };

      const target = JSON.stringify(dbError.meta?.target ?? '');

      if (
        dbError.code === 'P2002' &&
        target.includes('webhookId') &&
        typeof webhookId === 'string'
      ) {
        console.log('[Shopify Webhook] Duplicate delivery ignored', {
          webhookId,
          shopifyOrderId,
        });

        return {
          success: true,
          operation,
          skipped: true,
          reason: 'Duplicate webhook delivery',
        };
      }

      console.error('[Shopify Webhook] Database processing failed', {
        operation,
        shopifyOrderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }

    console.log('[Shopify Webhook] Processing complete', {
      operation,
      topic: operation === 'create' ? 'orders/create' : 'orders/updated',
      webhookId,
      shopifyOrderId,
      databaseOrderId: result.orderId,
      itemCount: lineItems.length,
      skipped: result.skipped,
    });

    return {
      success: true,
      operation,
      orderId: result.orderId,
      skipped: result.skipped,
      ...(result.skipped ? { reason: result.reason } : {}),
    };
  }
}
