// lib/tools/index.ts
import { tool } from 'ai';
import { z } from 'zod';

export const agentTools = {
  // Tool 1: Lookup database / mock stock data
  checkInventory: tool({
    description: 'Check real-time stock levels and warehouse availability for a product SKU.',
    inputSchema: z.object({
      sku: z.string().describe('The product SKU code, e.g. PROD-101 or ITEM-99'),
    }),
    execute: async ({ sku }: { sku: string }) => {
      // Replace with your real Prisma / Supabase / Drizzle query
      const mockDatabase: Record<string, { stock: number; location: string }> = {
        'PROD-101': { stock: 42, location: 'Warehouse A' },
        'PROD-202': { stock: 0, location: 'Backordered' },
        'PROD-303': { stock: 150, location: 'Warehouse B' },
      };

      const result = mockDatabase[sku.toUpperCase()];
      if (!result) {
        return { success: false, message: `No record found for SKU: ${sku}` };
      }

      return {
        success: true,
        sku: sku.toUpperCase(),
        inStock: result.stock > 0,
        unitsAvailable: result.stock,
        warehouse: result.location,
      };
    },
  }),

  // Tool 2: External action / notification
  sendNotification: tool({
    description: 'Dispatch an alert or message to a customer or operations manager.',
    inputSchema: z.object({
      recipient: z.string().email().describe('Target email address'),
      subject: z.string().describe('Short subject line'),
      body: z.string().describe('The main alert body text'),
    }),
    execute: async ({
      recipient,
      subject,
      body,
    }: {
      recipient: string;
      subject: string;
      body: string;
    }) => {
      // Replace with your real Resend / SendGrid / Slack API call
      return {
        delivered: true,
        recipient,
        subject,
        body,
        timestamp: new Date().toISOString(),
      };
    },
  }),

  // Tool 3: Web lookup / calculation
  calculateShipping: tool({
    description: 'Calculate shipping cost based on package weight and priority level.',
    inputSchema: z.object({
      weightKg: z.number().positive().describe('Weight of items in kg'),
      priority: z.enum(['standard', 'express']).describe('Delivery speed tier'),
    }),
    execute: async ({ weightKg, priority }: { weightKg: number; priority: 'standard' | 'express' }) => {
      const rate = priority === 'express' ? 12 : 5;
      const base = priority === 'express' ? 20 : 8;
      const total = base + weightKg * rate;
      return {
        priority,
        weightKg,
        estimatedCost: `$${total.toFixed(2)}`,
        estimatedDays: priority === 'express' ? 1 : 4,
      };
    },
  }),
};