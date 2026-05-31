import { pgTable, text, timestamp, boolean, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').unique().notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const otpCodes = pgTable('otp_codes', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
});

export const groups = pgTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').unique().notNull(),
  createdBy: text('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const groupMembers = pgTable('group_members', {
  id: text('id').primaryKey(),
  groupId: text('group_id')
    .references(() => groups.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const weeklyTodos = pgTable('weekly_todos', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  weekStart: date('week_start').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const todoItems = pgTable('todo_items', {
  id: text('id').primaryKey(),
  weeklyTodoId: text('weekly_todo_id')
    .references(() => weeklyTodos.id)
    .notNull(),
  title: text('title').notNull(),
  deadline: date('deadline'),
  // 'pending' | 'in_progress' | 'done'
  status: text('status').default('pending').notNull(),
  note: text('note'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
