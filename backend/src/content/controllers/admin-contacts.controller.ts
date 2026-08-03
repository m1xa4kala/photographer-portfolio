import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ContactsService } from '../services/contacts.service';
import { CreateContactDto } from '../dtos/create-contact.dto';
import { UpdateContactDto } from '../dtos/update-contact.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Controller('admin/contacts')
@UseGuards(JwtAuthGuard)
export class AdminContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  async findAll() {
    return this.contactsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new BadRequestException('Invalid id');
    return this.contactsService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreateContactDto) {
    return this.contactsService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.contactsService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateContactDto) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new BadRequestException('Invalid id');
    return this.contactsService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new BadRequestException('Invalid id');
    return this.contactsService.delete(numericId);
  }
}