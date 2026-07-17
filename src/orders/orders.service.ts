import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

const PRODUCT_SUMMARY_SELECT = {
  id: true,
  name: true,
  price: true,
  stock: true,
  imageUrl: true,
} as const;

const PRODUCT_WITH_CATEGORY_SELECT = {
  ...PRODUCT_SUMMARY_SELECT,
  category: { select: { id: true, name: true } },
} as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Only ${item.product.stock} unit(s) of "${item.product.name}" available`,
        );
      }
    }

    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          totalPrice,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: { product: { select: PRODUCT_SUMMARY_SELECT } },
          },
        },
      });

      for (const item of cart.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          throw new BadRequestException(
            `"${item.product.name}" no longer has enough stock`,
          );
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: { select: PRODUCT_WITH_CATEGORY_SELECT } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(userId: string, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { select: PRODUCT_WITH_CATEGORY_SELECT } },
        },
      },
    });

    // Same status for "doesn't exist" and "exists but isn't yours": a 403
    // here would confirm the id is valid, leaking which order ids exist.
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findAllAdmin() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: { product: { select: PRODUCT_SUMMARY_SELECT } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: {
          include: { product: { select: PRODUCT_SUMMARY_SELECT } },
        },
      },
    });
  }
}
