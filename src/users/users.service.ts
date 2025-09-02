import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { FilterUserDto } from './dto/filter-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Handle fullname generation from firstName and lastName
      let fullname = createUserDto.fullname;
      if (!fullname && createUserDto.firstName && createUserDto.lastName) {
        fullname = `${createUserDto.firstName} ${createUserDto.lastName}`;
      } else if (!fullname && createUserDto.firstName) {
        fullname = createUserDto.firstName;
      } else if (!fullname && createUserDto.lastName) {
        fullname = createUserDto.lastName;
      }

      const userData = {
        ...createUserDto,
        fullname,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      };

      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(filterUserDto: FilterUserDto): Promise<User[]> {
    const { limit = 10, offset = 0, email, username } = filterUserDto;

    const query = this.userRepository.createQueryBuilder('user');

    if (email) {
      query.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    if (username) {
      query.andWhere('user.username ILIKE :username', {
        username: `%${username}%`,
      });
    }

    query.skip(offset).take(limit);

    return query.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    try {
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.userRepository.remove(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { username } });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });
  }

  private handleExceptions(error: any): never {
    // TODO: Add error codes as they are encountered
    // if (error.code === 0) throw new BadRequestException(error.detail)

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
