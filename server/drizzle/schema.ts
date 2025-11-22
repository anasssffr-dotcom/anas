import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  created_at: timestamp("created_at").defaultNow()
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  room_id: varchar("room_id", { length: 255 }),
  user: varchar("user", { length: 255 }),
  text: text("text"),
  created_at: timestamp("created_at").defaultNow()
});
