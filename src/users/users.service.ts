import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { FilterUserDto } from './dto/filter-user.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

  async create(dto: CreateUserDto) {
    const user = this.userRepository.create(dto)
    await this.userRepository.save(user)
    return user
  }

  async findAll(dto: FilterUserDto) {
    const { 
      limit = 10, 
      offset = 0,
      email,
      username,
    } = dto

    const query = this.userRepository.createQueryBuilder('user')

    if (email) query.andWhere('user.email ILIKE :email', { email: `%${email}%`})
    
    if (username) query.andWhere('user.username ILIKE :username', { username: `%${username}%`})

    query.skip(offset).take(limit)

    return query.getMany()
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id })

    if (!user){
      throw new NotFoundException(`User with id ${id} not found`)
    }

    return user
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id,
      ...dto
    })

    if (!user){
      throw new NotFoundException(`User with id ${id} not found`)
    }

    await this.userRepository.save(user)
    return user
  }

  async remove(id: string) {
    const user = await this.userRepository.findOneBy({ id })

    if (!user){
      throw new NotFoundException(`User with id ${id} not found`)
    }

    this.userRepository.remove(user)
  }

  async findByEmail(email:string){
    return await this.userRepository.findOne({
      where:{email},
      select:[
        'id',
        'email',
        'username',
        'password'
      ]
    })
  }
}
