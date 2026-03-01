import { db } from "./db";
import {
  contacts,
  type Contact,
  type InsertContact,
  type UpdateContactRequest,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: UpdateContactRequest): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(insertContact).returning();
    return contact;
  }

  async updateContact(id: number, updates: UpdateContactRequest): Promise<Contact | undefined> {
    const [contact] = await db.update(contacts).set(updates).where(eq(contacts.id, id)).returning();
    return contact;
  }

  async deleteContact(id: number): Promise<boolean> {
    const [deleted] = await db.delete(contacts).where(eq(contacts.id, id)).returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();
