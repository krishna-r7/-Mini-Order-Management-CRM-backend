import { Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ShopifyWebhookService } from './shopify-webhook.service';

@Controller('webhooks/shopify')
export class ShopifyWebhookController {
  constructor(
    private readonly webhookService: ShopifyWebhookService,
  ) {}

  @Post('orders-create')
  @HttpCode(200)
  async handleOrderCreated(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.webhookService.handleOrderCreated(req);
    return res.json({ received: true });
  }

  @Post('orders-updated')
  @HttpCode(200)
  async handleOrderUpdated(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.webhookService.handleOrderUpdated(req);
    return res.json({ received: true });
  }
}