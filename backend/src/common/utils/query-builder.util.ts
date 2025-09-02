import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationParamsDto } from '../../common/dto/pagination-params.dto';

export class QueryBuilderUtil<T extends ObjectLiteral> {
  private queryBuilder: SelectQueryBuilder<T>;

  constructor(
    private repository: Repository<T>,
    private alias: string
  ) {
    this.queryBuilder = this.repository.createQueryBuilder(alias);
  }

  search(fields: string[], searchTerm?: string): this {
    if (searchTerm && fields.length > 0) {
      const conditions = fields
        .map(field => `LOWER(${this.alias}.${field}) LIKE LOWER(:searchTerm)`)
        .join(' OR ');
      
      this.queryBuilder.andWhere(`(${conditions})`, {
        searchTerm: `%${searchTerm}%`
      });
    }
    return this;
  }

  filter(filters: Record<string, any>): this {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          this.queryBuilder.andWhere(`${this.alias}.${key} IN (:...${key}Values)`, {
            [`${key}Values`]: value
          });
        } else {
          this.queryBuilder.andWhere(`${this.alias}.${key} = :${key}`, {
            [key]: value
          });
        }
      }
    });
    return this;
  }

  paginate(pagination?: PaginationParamsDto): this {
    if (pagination) {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;
      
      this.queryBuilder
        .skip(skip)
        .take(limit);
    }
    return this;
  }

  orderBy(field: string, order: 'ASC' | 'DESC' = 'DESC'): this {
    if (field) {
      this.queryBuilder.orderBy(`${this.alias}.${field}`, order);
    }
    return this;
  }

  getQueryBuilder(): SelectQueryBuilder<T> {
    return this.queryBuilder;
  }

  async getManyAndCount(): Promise<[T[], number]> {
    return this.queryBuilder.getManyAndCount();
  }

  async getOne(): Promise<T | null> {
    return this.queryBuilder.getOne() as Promise<T | null>;
  }

  leftJoinAndSelect(property: string, alias: string, condition?: string): this {
    this.queryBuilder.leftJoinAndSelect(property, alias, condition);
    return this;
  }

  innerJoinAndSelect(property: string, alias: string, condition?: string): this {
    this.queryBuilder.innerJoinAndSelect(property, alias, condition);
    return this;
  }

  where(condition: string, parameters?: any): this {
    this.queryBuilder.where(condition, parameters);
    return this;
  }

  andWhere(condition: string, parameters?: any): this {
    this.queryBuilder.andWhere(condition, parameters);
    return this;
  }

  select(selection: string): this {
    this.queryBuilder.select(selection);
    return this;
  }

  addSelect(selection: string): this {
    this.queryBuilder.addSelect(selection);
    return this;
  }

  groupBy(groupBy: string): this {
    this.queryBuilder.groupBy(groupBy);
    return this;
  }

  having(having: string, parameters?: any): this {
    this.queryBuilder.having(having, parameters);
    return this;
  }

  setParameter(key: string, value: any): this {
    this.queryBuilder.setParameter(key, value);
    return this;
  }
}
