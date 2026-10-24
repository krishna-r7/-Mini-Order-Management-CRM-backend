import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopifyService {

  constructor(
  private readonly configService: ConfigService,
  private readonly prisma: PrismaService,
) {}

  async getAccessToken(): Promise<string> {
    const shopDomain =
      this.configService.get<string>('SHOPIFY_STORE_DOMAIN');

    const clientId =
      this.configService.get<string>('SHOPIFY_CLIENT_ID');

    const clientSecret =
      this.configService.get<string>('SHOPIFY_CLIENT_SECRET');

    if (!shopDomain || !clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Shopify environment variables are missing',
      );
    }

    const response = await fetch(
      `https://${shopDomain}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();

      throw new InternalServerErrorException(
        `Shopify authentication failed: ${error}`,
      );
    }

    const data: { access_token: string; expires_in: number } =
      await response.json();

      console.log("assestoken" ,data.access_token);

    return data.access_token;
  }



async getOrders() {
  const accessToken = await this.getAccessToken();

  const shopDomain =
    this.configService.get<string>('SHOPIFY_STORE_DOMAIN');

  const response = await fetch(
    `https://${shopDomain}/admin/api/2026-10/orders.json?status=any&limit=10`,
    {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Shopify orders: ${error}`);
  }

  const data = await response.json();

  return data.orders.map((order: any) => ({
    shopifyOrderId: String(order.id),
    orderNumber: String(order.name),
    email: order.email ?? null,

    customerName: order.customer
      ? `${order.customer.first_name ?? ''} ${order.customer.last_name ?? ''}`.trim()
      : null,

    totalPrice: String(order.total_price),
    currency: order.currency,
    financialStatus: order.financial_status ?? null,
    fulfillmentStatus: order.fulfillment_status ?? null,

    shopifyCreatedAt: order.created_at,
    shopifyUpdatedAt: order.updated_at,

    items: (order.line_items ?? []).map((item: any) => ({
      shopifyLineItemId: String(item.id),

      shopifyProductId:
        item.product_id != null ? String(item.product_id) : null,

      shopifyVariantId:
        item.variant_id != null ? String(item.variant_id) : null,

      title: item.title || 'Unknown product',
      sku: item.sku || null,
      quantity: Number(item.quantity),
      unitPrice: String(item.price),

      totalPrice: (
        Number(item.price) * Number(item.quantity)
      ).toFixed(2),
    })),
  }));
}

async syncOrders() {
  const orders = await this.getOrders();

  const existingOrders = await this.prisma.order.findMany({
    where: {
      shopifyOrderId: {
        in: orders.map((order: any) => order.shopifyOrderId),
      },
    },
    select: {
      shopifyOrderId: true,
      shopifyUpdatedAt: true,
    },
  });

  const existingMap = new Map(
    existingOrders.map((order) => [
      order.shopifyOrderId,
      order.shopifyUpdatedAt?.getTime() ?? null,
    ]),
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const order of orders) {
    const existingUpdatedAt = existingMap.get(
      order.shopifyOrderId,
    );

    const incomingUpdatedAt = order.shopifyUpdatedAt
      ? new Date(order.shopifyUpdatedAt).getTime()
      : null;

    // Skip only when the order is unchanged AND products
    // have already been imported.
    let shouldSkip = false;

    if (
      existingMap.has(order.shopifyOrderId) &&
      existingUpdatedAt === incomingUpdatedAt
    ) {
      const existingOrder = await this.prisma.order.findUnique({
        where: {
          shopifyOrderId: order.shopifyOrderId,
        },
        select: {
          id: true,
          items: {
            select: {
              shopifyLineItemId: true,
            },
          },
        },
      });

      const existingItemIds = new Set(
        (existingOrder?.items ?? []).map(
          (item) => item.shopifyLineItemId,
        ),
      );

      const allItemsExist =
        existingOrder !== null &&
        existingItemIds.size === order.items.length &&
        order.items.every((item: any) =>
          existingItemIds.has(item.shopifyLineItemId),
        );

      shouldSkip = allItemsExist;
    }

    if (shouldSkip) {
      skipped++;
      continue;
    }

    const orderData = {
      orderNumber: order.orderNumber,
      email: order.email,
      customerName: order.customerName,
      totalPrice: order.totalPrice,
      currency: order.currency,
      financialStatus: order.financialStatus,
      fulfillmentStatus: order.fulfillmentStatus,

      shopifyCreatedAt: order.shopifyCreatedAt
        ? new Date(order.shopifyCreatedAt)
        : null,

      shopifyUpdatedAt: order.shopifyUpdatedAt
        ? new Date(order.shopifyUpdatedAt)
        : null,
    };

    await this.prisma.$transaction(async (tx) => {
      const savedOrder = await tx.order.upsert({
        where: {
          shopifyOrderId: order.shopifyOrderId,
        },
        update: orderData,
        create: {
          shopifyOrderId: order.shopifyOrderId,
          ...orderData,
        },
      });

      const incomingItemIds = order.items.map(
        (item: any) => item.shopifyLineItemId,
      );

      // Delete line items no longer present in Shopify.
      await tx.orderItem.deleteMany({
        where: {
          orderId: savedOrder.id,
          shopifyLineItemId: {
            notIn: incomingItemIds,
          },
        },
      });

      // Upsert every product line item.
      for (const item of order.items) {
        await tx.orderItem.upsert({
          where: {
            orderId_shopifyLineItemId: {
              orderId: savedOrder.id,
              shopifyLineItemId: item.shopifyLineItemId,
            },
          },

          update: {
            shopifyProductId: item.shopifyProductId,
            shopifyVariantId: item.shopifyVariantId,
            title: item.title,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },

          create: {
            shopifyLineItemId: item.shopifyLineItemId,
            shopifyProductId: item.shopifyProductId,
            shopifyVariantId: item.shopifyVariantId,
            title: item.title,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            orderId: savedOrder.id,
          },
        });
      }
    });

    if (existingMap.has(order.shopifyOrderId)) {
      updated++;
    } else {
      created++;
    }
  }

  return {
    success: true,
    fetched: orders.length,
    created,
    updated,
    skipped,
  };
}












}