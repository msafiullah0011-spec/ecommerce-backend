import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';
import { UpdateQuantityDto } from './dto/update-quantity.dto.js';

const PRODUCT_SUMMARY_SELECT = {
  id: true,
  name: true,
  price: true,
  stock: true,
  imageUrl: true,
} as const;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: { select: PRODUCT_SUMMARY_SELECT },
          },
        },
      },
    });
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });

    const requestedTotal = (existingItem?.quantity ?? 0) + dto.quantity;

    if (requestedTotal > product.stock) {
      throw new BadRequestException(
        `Only ${product.stock} unit(s) of "${product.name}" available`,
      );
    }

    return this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      update: {
        quantity: { increment: dto.quantity },
      },
      include: {
        product: { select: PRODUCT_SUMMARY_SELECT },
      },
    });
  }

  /**
   * A CartItem can't exist without a Cart, so this always looks the cart up
   * first; if there's no cart at all, or no matching item, both mean the
   * same thing to the caller: "this product isn't in your cart."
   */
  private async findCartItemOrThrow(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    const item = cart
      ? await this.prisma.cartItem.findUnique({
          where: { cartId_productId: { cartId: cart.id, productId } },
        })
      : null;

    if (!cart || !item) {
      throw new NotFoundException('This product is not in your cart');
    }

    return { cart, item };
  }

  async updateItemQuantity(userId: string, productId: string, dto: UpdateQuantityDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.quantity > product.stock) {
      throw new BadRequestException(
        `Only ${product.stock} unit(s) of "${product.name}" available`,
      );
    }

    const { cart } = await this.findCartItemOrThrow(userId, productId);

    return this.prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity: dto.quantity },
      include: {
        product: { select: PRODUCT_SUMMARY_SELECT },
      },
    });
  }

  async removeItem(userId: string, productId: string) {
    const { cart } = await this.findCartItemOrThrow(userId, productId);

    return this.prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
      include: {
        product: { select: PRODUCT_SUMMARY_SELECT },
      },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      return { count: 0 };
    }

    return this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
