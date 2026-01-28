import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.greetings.get.path, async (req, res) => {
    const greetings = await storage.getGreetings();
    res.json(greetings);
  });

  return httpServer;
}

// Seed function to ensure we have a Hello World message
export async function seedDatabase() {
  const existingGreetings = await storage.getGreetings();
  if (existingGreetings.length === 0) {
    await storage.createGreeting({ message: "Hello World" });
  }
}
