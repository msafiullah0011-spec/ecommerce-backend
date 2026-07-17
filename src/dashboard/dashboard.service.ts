import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Orders in these statuses represent money actually earned: PENDING hasn't
// been paid yet, CANCELLED was voided. PAID/SHIPPED/DELIVERED all started
// with a real payment.
const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

interface OrderStatusGroup {
  status: OrderStatus;
  _count: number;
}

interface TopSellingGroup {
  productId: string;
  _sum: { quantity: number | null };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      statusGroups,
      revenueAggregate,
      lowStockProducts,
      latestOrders,
      topSellingGroups,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.category.count(),
      this.prisma.order.count(),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: { status: { in: REVENUE_STATUSES } },
        _sum: { totalPrice: true },
      }),
      this.prisma.product.findMany({
        where: { stock: { lte: 5 } },
        select: {
          id: true,
          name: true,
          stock: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: { stock: 'asc' },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { status: { in: REVENUE_STATUSES } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    const ordersByStatus = this.buildOrdersByStatusMap(statusGroups);
    const topSellingProducts = await this.buildTopSellingProducts(topSellingGroups);

    return {
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      totalRevenue: revenueAggregate._sum.totalPrice ?? 0,
      pendingOrders: ordersByStatus.PENDING,
      paidOrders: ordersByStatus.PAID,
      shippedOrders: ordersByStatus.SHIPPED,
      deliveredOrders: ordersByStatus.DELIVERED,
      cancelledOrders: ordersByStatus.CANCELLED,
      lowStockProducts,
      topSellingProducts,
      latestOrders,
    };
  }

  /**
   * groupBy only returns buckets that have at least one row, so a status
   * with zero orders would simply be missing from statusGroups. This fills
   * every status in explicitly, defaulting to 0.
   */
  private buildOrdersByStatusMap(statusGroups: OrderStatusGroup[]): Record<OrderStatus, number> {
    const counts: Record<OrderStatus, number> = {
      PENDING: 0,
      PAID: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    for (const group of statusGroups) {
      counts[group.status] = group._count;
    }

    return counts;
  }

  /**
   * groupBy already ranked these 10 products by quantity sold (a plain SUM,
   * which Prisma supports natively). Revenue per product needs quantity *
   * price, which Prisma's aggregates can't express, so it's computed here
   * from just these 10 products' order items, not the whole table.
   */
  private async buildTopSellingProducts(topSellingGroups: TopSellingGroup[]) {
    if (topSellingGroups.length === 0) {
      return [];
    }

    const productIds = topSellingGroups.map((group) => group.productId);

    const [orderItems, products] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: {
          productId: { in: productIds },
          order: { status: { in: REVENUE_STATUSES } },
        },
        select: { productId: true, quantity: true, price: true },
      }),
      this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, imageUrl: true },
      }),
    ]);

    const revenueByProduct = new Map<string, number>();
    for (const item of orderItems) {
      const current = revenueByProduct.get(item.productId) ?? 0;
      revenueByProduct.set(item.productId, current + item.quantity * item.price);
    }

    const productsById = new Map(products.map((product) => [product.id, product]));

    return topSellingGroups.map((group) => ({
      product: productsById.get(group.productId) ?? null,
      totalQuantitySold: group._sum.quantity ?? 0,
      revenueGenerated: revenueByProduct.get(group.productId) ?? 0,
    }));
  }
}
