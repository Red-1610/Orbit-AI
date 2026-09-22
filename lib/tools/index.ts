// lib/tools/index.ts
import { tool } from 'ai';
import { z } from 'zod';
import { createClient, createServiceRoleClient } from '@/lib/db/server';

export const agentTools = {
  checkInventory: tool({
    description: 'Check stock levels and warehouse availability for a product SKU.',
    inputSchema: z.object({
      sku: z.string().describe('The product SKU code, e.g. PROD-101 or ITEM-99'),
    }),
    execute: async ({ sku }: { sku: string }) => {
      const admin = createServiceRoleClient();
      const { data, error } = await admin
        .from('products')
        .select('*')
        .eq('sku', sku.toUpperCase())
        .maybeSingle();

      if (error || !data) {
        return { success: false, message: `No record found for SKU: ${sku}` };
      }

      return {
        success: true,
        sku: data.sku,
        inStock: data.stock > 0,
        unitsAvailable: data.stock,
        warehouse: data.location,
      };
    },
  }),

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
      const authSupabase = await createClient();
      const { data: { user } } = await authSupabase.auth.getUser();
      const admin = createServiceRoleClient();

      const { error } = await admin
        .from('notifications_log')
        .insert({
          user_id: user?.id ?? null,
          recipient,
          subject,
          body,
          status: 'sent',
        });

      if (error) {
        console.error('Failed to log notification:', error.message);
        return {
          delivered: false,
          error: error.message,
          recipient,
          subject,
          body,
        };
      }

      return {
        delivered: true,
        recipient,
        subject,
        body,
        timestamp: new Date().toISOString(),
      };
    },
  }),

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