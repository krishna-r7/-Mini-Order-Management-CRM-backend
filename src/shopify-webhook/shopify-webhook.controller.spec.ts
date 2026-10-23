import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyWebhookController } from './shopify-webhook.controller';

describe('ShopifyWebhookController', () => {
  let controller: ShopifyWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopifyWebhookController],
    }).compile();

    controller = module.get<ShopifyWebhookController>(ShopifyWebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
