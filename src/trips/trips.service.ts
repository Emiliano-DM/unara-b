import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { In, Repository } from 'typeorm';
import { FilterTripDto } from './dto/filter-trip.dto';
import { User } from 'src/users/entities/user.entity';
import {FilesService} from 'src/files/files.service';
import {CloudinaryProvider} from 'src/cloudinary/cloudinary.provider';

@Injectable()
export class TripsService {

  constructor(
    
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly filesService:FilesService,
    private readonly cloudinaryProvider:CloudinaryProvider

  ){}

  async create(dto: CreateTripDto) {
      const { userIds, ...tripData } = dto;

      const users = await this.userRepository.find({
          where: { id: In(userIds) }
      });

      if (users.length !== userIds.length) {
          throw new NotFoundException("Some users not found");
      }

      const trip = this.tripRepository.create({
          ...tripData,
          users: users
      });

      await this.tripRepository.save(trip);
      return trip;
  }

  async findAll(dto: FilterTripDto) {
      const { 
        limit = 10, 
        offset = 0,
        name,
        description, 
        destination,
        startDate,
        endDate
      } = dto;

      const query = this.tripRepository
                        .createQueryBuilder('trip')
                        .leftJoinAndSelect('trip.users', 'user');

      if (name) query.andWhere('trip.name ILIKE :name', { name: `%${name}%` });
      if (description) query.andWhere('trip.description ILIKE :description', { description: `%${description}%` });
      if (destination) query.andWhere('trip.destination ILIKE :destination', { destination: `%${destination}%` });
      if (startDate) query.andWhere('trip.startDate >= :startDate', { startDate });
      if (endDate) query.andWhere('trip.endDate <= :endDate', { endDate });

      query.skip(offset).take(limit);

      return query.getMany();
  }

  async findOne(id: string) {
      const trip = await this.tripRepository.findOne({
          where: { id },
          relations: {
              users: true,
              places: true,
              activities: true,
              luggage: true
          }
      });

      if (!trip) {
          throw new NotFoundException(`Trip with id ${id} not found`);
      }

      return trip;
  }

  async update(id: string, dto: UpdateTripDto) {
      const { userIds, ...tripData } = dto;

      let users: User[] | null = null;
      if (userIds) {
          users = await this.userRepository.find({
              where: { id: In(userIds) }
          });

          if (users.length !== userIds.length) {
              throw new NotFoundException("Some users not found");
          }
      }

      const trip = await this.tripRepository.preload({
          id,
          ...tripData,
          ...(users ? { users } : {})
      });

      if (!trip) {
          throw new NotFoundException(`Trip with id ${id} not found`);
      }

      await this.tripRepository.save(trip);
      return trip;
  }

  async remove(id: string) {
    const trip = await this.tripRepository.findOneBy({ id })

    if (!trip){
      throw new NotFoundException(`Trip with id ${id} not found`)
    }

    this.tripRepository.remove(trip)
  }

  async addTripPhoto(image: Express.Multer.File, tripId: string, userId: string) {
    const {publicId, url} = await this.cloudinaryProvider.uploadFile(image)
    const trip = await this.tripRepository.findOne({where: {id:tripId}, relations: {users: true}})
    const user:User | null = await this.userRepository.findOneBy({id:userId})
    if (!user){
        throw new UnauthorizedException('Invalid User')
    }
    if (!trip){
        throw new NotFoundException('Invalid trip')
    }

    if (!trip.users.some(u => u.id === user.id)) {
        throw new UnauthorizedException('The user is not part of the trip')
    }
    await this.filesService.saveFileMetadata(
        url,
        user,
        'trip_profile_photo',
        image.size,
        image.mimetype,
        publicId,
        trip.id
    )
    
    await this.tripRepository.update(trip.id, {trip_photo: url})
    return trip
  }

  async addTripDocuments(files: Express.Multer.File[], tripId: string, userId:string, isPrivate?:boolean){
    const uploadResults = await Promise.all(files.map(file => this.cloudinaryProvider.uploadFile(file)))
    const trip = await this.tripRepository.findOne({where: {id:tripId}, relations: {users: true}})
    const user:User | null = await this.userRepository.findOneBy({id:userId})
        if (!user){
        throw new UnauthorizedException('Invalid User')
    }
    if (!trip){
        throw new NotFoundException('Invalid trip')
    }

    if (!trip.users.some(u => u.id === user.id)) {
        throw new UnauthorizedException('The user is not part of the trip')
    }
    await Promise.all(uploadResults.map((uploadResult, index) => this.filesService.saveFileMetadata(
        uploadResult.url,
        user,
        'trip_files',
        files[index].size,
        files[index].mimetype,
        uploadResult.publicId,
        trip.id,
        isPrivate
    )))

    return trip
  }
}
