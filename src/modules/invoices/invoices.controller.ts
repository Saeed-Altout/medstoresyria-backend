import { Controller, Get, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { Invoice } from './entities/invoice.entity';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@Controller('api/v1/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles(Role.ADMIN, Role.SALES, Role.ACCOUNTANT)
  @Post('orders/:orderId')
  @ApiOperation({ summary: 'Generate invoice for an order' })
  @ApiResponse({ status: 201, description: 'Invoice generated' })
  async generate(@Param('orderId', ParseUUIDPipe) orderId: string): Promise<HandlerResult<Invoice>> {
    const data = await this.invoicesService.generate(orderId);
    return { messageKey: 'INVOICE_GENERATED', data, statusCode: 201 };
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get()
  @ApiOperation({ summary: 'List all invoices' })
  @ApiResponse({ status: 200, description: 'Invoices fetched' })
  async findAll(): Promise<HandlerResult<Invoice[]>> {
    const data = await this.invoicesService.findAll();
    return { data };
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.SALES)
  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice fetched' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<Invoice>> {
    const data = await this.invoicesService.findById(id);
    return { data };
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.SALES)
  @Get(':id/download')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiResponse({ status: 200, description: 'PDF streamed' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, invoiceNumber } = await this.invoicesService.download(id, userId, userRole);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
