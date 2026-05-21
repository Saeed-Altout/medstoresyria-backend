function randomDigits(length: number): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

function datePart(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function generateOrderNumber(): string {
  return `ORD-${datePart()}-${randomDigits(4)}`;
}

export function generateMaintenanceNumber(): string {
  return `MNT-${datePart()}-${randomDigits(4)}`;
}

export function generateInvoiceNumber(): string {
  return `INV-${datePart()}-${randomDigits(4)}`;
}
