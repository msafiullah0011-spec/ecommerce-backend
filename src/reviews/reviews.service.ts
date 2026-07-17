import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

const REVIEW_AUTHOR_SELECT = {
  id: true,
  name: true,
} as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProductExists(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }

  async findAllForProduct(productId: string) {
    await this.assertProductExists(productId);

    const [reviews, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        include: { user: { select: REVIEW_AUTHOR_SELECT } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      reviews,
      summary: {
        averageRating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
        totalReviews: aggregate._count,
      },
    };
  }

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    await this.assertProductExists(productId);

    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: { user: { select: REVIEW_AUTHOR_SELECT } },
    });
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own review');
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        comment: dto.comment,
      },
      include: { user: { select: REVIEW_AUTHOR_SELECT } },
    });
  }

  async remove(userId: string, role: Role, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const isOwner = review.userId === userId;
    const isAdmin = role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own review');
    }

    return this.prisma.review.delete({
      where: { id },
      include: { user: { select: REVIEW_AUTHOR_SELECT } },
    });
  }
}
