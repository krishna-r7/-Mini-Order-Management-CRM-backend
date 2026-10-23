
import {
  Controller,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
