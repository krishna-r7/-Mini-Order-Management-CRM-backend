import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const search = query.search?.trim();
    const status = query.status?.trim();

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const where = {
      ...(search
        ? {
            OR: [
              {
                orderNumber: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                customerName: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(status && status.toLowerCase() !== 'all'
        ? {
            financialStatus: {
              equals: status,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        
        orderBy: {
          shopifyCreatedAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
    });
  }
}
