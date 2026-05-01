import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  plan: text("plan").notNull().default("free"),
  usageResumeCount: integer("usage_resume_count").notNull().default(0),
  usageCoverLetterCount: integer("usage_cover_letter_count").notNull().default(0),
  usageResetDate: timestamp("usage_reset_date").defaultNow(),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resumesTable = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coverLettersTable = pgTable("cover_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  jobTitle: text("job_title"),
  companyName: text("company_name"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export const insertResumeSchema = createInsertSchema(resumesTable);
export const insertCoverLetterSchema = createInsertSchema(coverLettersTable);

export type User = typeof usersTable.$inferSelect;
export type Resume = typeof resumesTable.$inferSelect;
export type CoverLetter = typeof coverLettersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;
