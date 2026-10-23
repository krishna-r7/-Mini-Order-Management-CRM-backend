
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ShopifyService } from './shopify/shopify.service';
import { ShopifyController } from './shopify/shopify.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ShopifyWebhookController } from './shopify-webhook/shopify-webhook.controller';
import { ShopifyWebhookService } from './shopify-webhook/shopify-webhook.service';

@Module({
    imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  controllers: [AppController, ShopifyController, ShopifyWebhookController],
  providers: [AppService, ShopifyService, ShopifyWebhookService],
})
export class AppModule {}
