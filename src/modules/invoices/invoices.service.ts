import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import { AppException } from '../../common/exceptions/app.exception';
import { generateInvoiceNumber } from '../../common/utils/generators.util';
import { Role } from '../../common/enums/role.enum';
import { StorageService } from '../storage/storage.service';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceAlreadyExistsException, InvoiceNotFoundException } from './exceptions/invoice.exceptions';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly storageService: StorageService,
  ) {}

  async generate(orderId: string): Promise<Invoice> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'governorate', 'invoice'],
    });
    if (!order) throw new AppException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    if (order.invoice) throw new InvoiceAlreadyExistsException();

    const invoiceNumber = generateInvoiceNumber();
    const pdfBuffer = await this.buildPdf(order, invoiceNumber);

    const filename = `invoices/${invoiceNumber}.pdf`;
    const pdfUrl = await this.storageService.uploadFile('invoices', pdfBuffer, filename, 'application/pdf');

    const invoice = this.invoiceRepo.create({
      invoice_number: invoiceNumber,
      pdf_url: pdfUrl,
      order: { id: orderId },
    });
    return this.invoiceRepo.save(invoice);
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      relations: ['order'],
      order: { issued_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['order', 'order.items', 'order.governorate'],
    });
    if (!invoice) throw new InvoiceNotFoundException();
    return invoice;
  }

  async download(id: string, userId: string, userRole: Role): Promise<{ buffer: Buffer; invoiceNumber: string }> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['order', 'order.items', 'order.governorate'],
    });
    if (!invoice) throw new InvoiceNotFoundException();

    const isStaff = [Role.ADMIN, Role.ACCOUNTANT, Role.SALES].includes(userRole);
    if (!isStaff) {
      const order = await this.orderRepo.findOne({
        where: { id: invoice.order.id, user: { id: userId } },
      });
      if (!order) throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const buffer = await this.buildPdf(invoice.order, invoice.invoice_number);
    return { buffer, invoiceNumber: invoice.invoice_number };
  }

  private buildPdf(order: Order & { items?: OrderItem[] }, invoiceNumber: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const blue = '#1A56DB';
      const gray = '#6B7280';
      const light = '#F9FAFB';
      const pageWidth = 595 - 100; // A4 minus margins

      // ── Header ─────────────────────────────────────────────────
      doc.rect(0, 0, 595, 90).fill(blue);
      doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('MedStore Syria', 50, 25);
      doc.fontSize(11).font('Helvetica').text('Your Trusted Medical Devices Partner', 50, 55);

      // ── Invoice meta ───────────────────────────────────────────
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold');
      doc.text(`Invoice #: ${invoiceNumber}`, 50, 110);
      doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 50, 125);
      doc.text(`Order #: ${order.order_number}`, 50, 140);

      // ── Bill To ────────────────────────────────────────────────
      doc.moveDown(1);
      doc.fillColor(blue).fontSize(12).font('Helvetica-Bold').text('Bill To', 50, 170);
      doc.moveTo(50, 185).lineTo(545, 185).strokeColor('#E5E7EB').stroke();
      doc.fillColor('#111827').fontSize(10).font('Helvetica');
      doc.text(order.customer_name, 50, 193);
      doc.text(order.customer_email, 50, 208);
      doc.text(order.customer_phone, 50, 223);
      doc.text(`${(order.governorate as { name?: string })?.name ?? ''} — ${order.address_detail}`, 50, 238, { width: pageWidth });

      // ── Items table header ─────────────────────────────────────
      const tableTop = 285;
      doc.rect(50, tableTop, pageWidth, 22).fill(blue);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
      doc.text('Product', 55, tableTop + 6, { width: 260 });
      doc.text('Qty', 320, tableTop + 6, { width: 50, align: 'center' });
      doc.text('Unit Price', 375, tableTop + 6, { width: 80, align: 'right' });
      doc.text('Total', 460, tableTop + 6, { width: 80, align: 'right' });

      // ── Items rows ─────────────────────────────────────────────
      const items: OrderItem[] = (order.items as OrderItem[] | undefined) ?? [];
      let y = tableTop + 26;
      items.forEach((item, i) => {
        if (i % 2 === 0) doc.rect(50, y - 4, pageWidth, 20).fill(light);
        doc.fillColor('#111827').fontSize(9).font('Helvetica');
        doc.text(item.product_name_snapshot, 55, y, { width: 260 });
        doc.text(String(item.quantity), 320, y, { width: 50, align: 'center' });
        doc.text(`$${parseFloat(item.product_price_snapshot).toFixed(2)}`, 375, y, { width: 80, align: 'right' });
        doc.text(`$${parseFloat(item.total_usd).toFixed(2)}`, 460, y, { width: 80, align: 'right' });
        y += 20;
      });

      // ── Grid bottom border ─────────────────────────────────────
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#D1D5DB').stroke();

      // ── Totals ─────────────────────────────────────────────────
      y += 14;
      const totalsLeft = 370;
      doc.fillColor(gray).fontSize(10).font('Helvetica');
      doc.text('Subtotal:', totalsLeft, y, { width: 90, align: 'right' });
      doc.fillColor('#111827').text(`$${parseFloat(order.subtotal_usd).toFixed(2)}`, 465, y, { width: 75, align: 'right' });
      y += 18;
      doc.fillColor(gray).text('Delivery Fee:', totalsLeft, y, { width: 90, align: 'right' });
      doc.fillColor('#111827').text(`$${parseFloat(order.delivery_fee_usd).toFixed(2)}`, 465, y, { width: 75, align: 'right' });
      y += 18;
      doc.moveTo(370, y).lineTo(545, y).strokeColor('#D1D5DB').stroke();
      y += 8;
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12);
      doc.text('Grand Total:', totalsLeft, y, { width: 90, align: 'right' });
      doc.text(`$${parseFloat(order.total_usd).toFixed(2)}`, 465, y, { width: 75, align: 'right' });

      // ── Footer ─────────────────────────────────────────────────
      doc.fillColor(gray).fontSize(9).font('Helvetica');
      doc.text('Thank you for your trust — شكراً لثقتكم', 50, 750, { align: 'center', width: pageWidth });

      doc.end();
    });
  }
}
