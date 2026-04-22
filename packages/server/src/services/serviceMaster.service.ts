import { prisma } from '../config';
import { AppError } from '../middleware';

interface CreateServiceInput {
  name: string;
  description?: string | null;
  defaultFee: number;
  hasExpiry: boolean;
  defaultValidityDays?: number | null;
  isActive?: boolean;
}

export class ServiceMasterService {
  static async list() {
    return prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError('Service not found', 404);
    return service;
  }

  static async create(data: CreateServiceInput) {
    const existing = await prisma.service.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError('Service with this name already exists', 409);
    return prisma.service.create({ data });
  }

  static async update(id: string, data: Partial<CreateServiceInput>) {
    await this.getById(id);

    if (data.name) {
      const existing = await prisma.service.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (existing) throw new AppError('Service with this name already exists', 409);
    }

    return prisma.service.update({ where: { id }, data });
  }
}
