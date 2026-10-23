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
    email: order.email,
    customerName: order.customer
      ? `${order.customer.first_name ?? ''} ${order.customer.last_name ?? ''}`.trim()
      : null,
    totalPrice: order.total_price,
    currency: order.currency,
    financialStatus: order.financial_status,
    fulfillmentStatus: order.fulfillment_status,
    shopifyCreatedAt: order.created_at,
    shopifyUpdatedAt: order.updated_at,
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

    // Skip orders that haven't changed in Shopify.
    if (existingMap.has(order.shopifyOrderId) &&
      existingUpdatedAt === incomingUpdatedAt) {
      skipped++;
      continue;
    }

    const data = {
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

    await this.prisma.order.upsert({
      where: {
        shopifyOrderId: order.shopifyOrderId,
      },
      update: data,
      create: {
        shopifyOrderId: order.shopifyOrderId,
        ...data,
      },
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