import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { User } from '../user/entities/user.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createContactDto: CreateContactDto,
    ownerId: number,
  ): Promise<Contact> {
    if (ownerId === createContactDto.contactUserId) {
      throw new BadRequestException('Cannot add yourself as a contact');
    }

    const [owner, contactUser] = await Promise.all([
      this.userRepository.findOne({ where: { id: ownerId } }),
      this.userRepository.findOne({
        where: { id: createContactDto.contactUserId },
      }),
    ]);

    if (!owner) throw new NotFoundException('Owner user not found');
    if (!contactUser) throw new NotFoundException('Contact user not found');

    const existingContact = await this.contactRepository.findOne({
      where: {
        owner: { id: ownerId },
        contact: { id: createContactDto.contactUserId },
      },
    });

    if (existingContact) {
      return existingContact;
    }

    return this.contactRepository.save(
      this.contactRepository.create({ owner, contact: contactUser }),
    );
  }

  async findAll(): Promise<Contact[]> {
    return this.contactRepository.find({ relations: ['owner', 'contact'] });
  }

  async findOne(id: number): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id },
      relations: ['owner', 'contact'],
    });
    if (!contact)
      throw new NotFoundException(`Contact with ID ${id} not found`);
    return contact;
  }

  async update(
    id: number,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    const contact = await this.findOne(id);

    if (updateContactDto.ownerUserId) {
      const owner = await this.userRepository.findOne({
        where: { id: updateContactDto.ownerUserId },
      });
      if (!owner) throw new NotFoundException('New owner user not found');
      contact.owner = owner;
    }

    if (updateContactDto.contactUserId) {
      if (contact.owner.id === updateContactDto.contactUserId) {
        throw new BadRequestException('Cannot set owner as contact');
      }
      const contactUser = await this.userRepository.findOne({
        where: { id: updateContactDto.contactUserId },
      });
      if (!contactUser)
        throw new NotFoundException('New contact user not found');
      contact.contact = contactUser;
    }

    return this.contactRepository.save(contact);
  }

  async remove(id: number): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactRepository.remove(contact);
  }

  async getUserContacts(userId: number): Promise<Contact[]> {
    return this.contactRepository.find({
      where: { owner: { id: userId } },
      relations: ['contact'],
      order: { created_at: 'DESC' },
    });
  }

  async findContactBetweenUsers(
    user1Id: number,
    user2Id: number,
  ): Promise<Contact | null> {
    return this.contactRepository.findOne({
      where: [
        { owner: { id: user1Id }, contact: { id: user2Id } },
        { owner: { id: user2Id }, contact: { id: user1Id } },
      ],
      relations: ['owner', 'contact'],
    });
  }

  async searchContacts(
    userId: number,
    search: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const [results, total] = await this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.contact', 'user')
      .where('contact.ownerId = :userId', { userId })
      .andWhere('(user.name LIKE :search OR user.email LIKE :search)', {
        search: `%${search}%`,
      })
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();

    return {
      data: results,
      total,
      page,
      limit,
      last_page: Math.ceil(total / limit),
    };
  }
}
