import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get(api.contacts.list.path, async (req, res) => {
    try {
      const contactsList = await storage.getContacts();
      res.json(contactsList);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.contacts.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const contact = await storage.getContact(id);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      res.json(contact);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.contacts.create.path, async (req, res) => {
    try {
      const input = api.contacts.create.input.parse(req.body);
      const contact = await storage.createContact(input);
      res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.contacts.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const input = api.contacts.update.input.parse(req.body);
      const contact = await storage.updateContact(id, input);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      res.json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.contacts.delete.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const deleted = await storage.deleteContact(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed data function
  async function seedDatabase() {
    try {
      const existingItems = await storage.getContacts();
      if (existingItems.length === 0) {
        await storage.createContact({ name: "Alice Dupont", email: "alice@example.com", phone: "0123456789" });
        await storage.createContact({ name: "Bob Martin", email: "bob@example.com", phone: "0987654321" });
        await storage.createContact({ name: "Charlie Durand", email: "charlie@example.com", phone: "0612345678" });
      }
    } catch (err) {
      console.error("Failed to seed database:", err);
    }
  }

  // Ensure tables are there before seeding
  // Usually done by db:push beforehand
  seedDatabase();

  return httpServer;
}
