import { BleManager, Device } from 'react-native-ble-plx';

let manager: BleManager | null = null;

function m(): BleManager {
  if (!manager) manager = new BleManager();
  return manager;
}

export async function scanPrinters(timeout = 5000): Promise<Device[]> {
  const list: Device[] = [];
  return new Promise((resolve, reject) => {
    m().startDeviceScan(null, null, (err, dev) => {
      if (err) { m().stopDeviceScan(); reject(err); return; }
      if (dev && dev.name && !list.find(d => d.id === dev.id)) list.push(dev);
    });
    setTimeout(() => { m().stopDeviceScan(); resolve(list); }, timeout);
  });
}

let connectedDevices: Map<string, Device> = new Map();

export async function connectPrinter(id: string): Promise<Device> {
  const existing = connectedDevices.get(id);
  if (existing) {
    try {
      await existing.discoverAllServicesAndCharacteristics();
      return existing;
    } catch {}
  }
  const d = await m().connectToDevice(id);
  await d.discoverAllServicesAndCharacteristics();
  connectedDevices.set(id, d);
  return d;
}

export async function disconnectPrinter(d: Device) {
  connectedDevices.delete(d.id);
  try { await d.cancelConnection(); } catch {}
}

export async function printESC(d: Device, data: Uint8Array): Promise<boolean> {
  const services = await d.services();
  for (const svc of services) {
    const chars = await svc.characteristics();
    for (const ch of chars) {
      if (ch.isWritableWithResponse || ch.isWritableWithoutResponse) {
        const b64 = btoa(String.fromCharCode(...data));
        const chunkSize = 512;
        for (let i = 0; i < b64.length; i += chunkSize) {
          const chunk = b64.slice(i, i + chunkSize);
          await d.writeCharacteristicWithResponseForService(svc.uuid, ch.uuid, chunk);
        }
        return true;
      }
    }
  }
  throw new Error('Printer tidak mendukung penulisan data');
}

export function buildReceipt(order: any): Uint8Array {
  const Encoder = require('esc-pos-encoder');
  const e = new Encoder();
  e.initialize()
    .align('center').size(2, 2).text('LAUNDRY POS')
    .size(1, 1).text(order.invoice_number || '').newline()
    .line('='.repeat(32))
    .align('left')
    .text(`${new Date(order.created_at).toLocaleDateString('id-ID')} ${new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`)
    .text(`Estimasi: ${order.estimated_done_at ? new Date(order.estimated_done_at).toLocaleDateString('id-ID') : '-'}`)
    .line('-'.repeat(32));
  (order.items || []).forEach((i: any) => {
    e.text(i.service_name);
    e.text(`  ${i.quantity} ${i.unit} x Rp ${(i.unit_price || 0).toLocaleString()}`);
    e.text(`  = Rp ${(i.subtotal || 0).toLocaleString()}`);
  });
  e.line('-'.repeat(32))
    .align('right').size(2, 2).text(`Rp ${(order.grand_total || 0).toLocaleString()}`)
    .size(1, 1).newline()
    .align('left').text(`Bayar: ${order.payment_status === 'paid' ? 'LUNAS' : 'BELUM DIBAYAR'}`)
    .newline().align('center').text('Terima kasih').newline(3).cut('partial');
  return e.encode();
}
