import { Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { FilterUserDto } from './dto/filter-user.dto';
import { FilesService } from 'src/files/files.service';
import { CloudinaryProvider } from 'src/cloudinary/cloudinary.provider';
import { use } from 'passport';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly filesService:FilesService,
    private readonly cloudinaryProvider:CloudinaryProvider
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
        'password',
        'isEmailVerified',
        'isActive'
      ]
    })
  }

  async findOnePublic(term:string){
    return await this.userRepository.createQueryBuilder('user')
      .select([
        'user.id', 
        'user.username', 
        'user.profile_picture'
      ])
      .where('user.username ILIKE :term OR user.email ILIKE :term', {term:`%${term}%`})
      .getMany()
  }

  async findOneWithRefreshToken(id:string){
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'username', 'refresh_token']        
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }


  async findOneWithResetToken(id:string){
    const user = await this.userRepository.findOne({
      where:{id},
      select: ['id','email','username','password_reset_token','password_reset_expires']
    })
    
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async findOneWithVerificationToken(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'emailVerificationToken', 'emailVerificationExpires', 'isEmailVerified']
    });
  }

  async addProfileImage(image: Express.Multer.File, id:string){
    const {publicId, url} = await this.cloudinaryProvider.uploadFile(image)
    const user:User|null = await this.userRepository.findOneBy({id})
    if (!user){
      throw new UnauthorizedException('Invalid user')
    }
    await this.filesService.saveFileMetadata(
      url,
      user,
      'profile_photo',
      image.size,
      image.mimetype,
      publicId,
      user.id
    )
    await this.userRepository.update(user.id, {profile_picture: url})
    return user
  }
}
