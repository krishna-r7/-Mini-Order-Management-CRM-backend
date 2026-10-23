import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyWebhookService } from './shopify-webhook.service';

describe('ShopifyWebhookService', () => {
  let service: ShopifyWebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopifyWebhookService],
    }).compile();

    service = module.get<ShopifyWebhookService>(ShopifyWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
