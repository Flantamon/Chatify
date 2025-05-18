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

    console.log(existingContact);

    if (existingContact) {
      return existingContact;
    }

    return this.contactRepository.save(
      this.contactRepository.create({ owner, contact: contactUser }),
    );
  }

  async findAll(ownerId: number): Promise<Contact[]> {
    const contacts = await this.contactRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['owner', 'contact'],
    });

    const uniqueContacts = contacts.filter(
      (contact) => contact.contact.id !== ownerId,
    );

    return uniqueContacts;
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

  async remove(id: number): Promise<Contact> {
    const contact = await this.findOne(id);
    await this.contactRepository.remove(contact);
    return contact;
  }
}
