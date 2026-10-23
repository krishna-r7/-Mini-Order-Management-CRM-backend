import { Controller, Get } from '@nestjs/common';
import { ShopifyService } from './shopify.service';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Get('test-auth')
  async testAuth() {
    await this.shopifyService.getAccessToken();
    return {
      success: true,
      message: 'Successfully authenticated with Shopify',
    };
  }

  @Get('syncorders')
  async syncOrders() {
    return this.shopifyService.syncOrders();
  }
}
