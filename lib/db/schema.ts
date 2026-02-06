import { integer, pgEnum, serial, time, varchar } from 'drizzle-orm/pg-core';
import { numeric, pgTable } from "drizzle-orm/pg-core";

export const dayWeekEnum = pgEnum('day_week', [
  'Понедельник',
  'Вторник', 
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
])

export const lessonTime = pgEnum('lesson_time', [
    '08:30 - 10:10',
    '10:20 - 12:00',
    '12:45 - 14:25',
    '14:35 - 16:15',
    '16:25 - 18:05'
])

export const groups = pgTable('groups', {
    number: numeric('number').primaryKey(),
    countStudent: numeric('students')
});


export const lessons = pgTable('lessons', {
    id: serial('id').primaryKey(),
    subject: varchar('subject', { length: 100}),
    teacher: varchar('teacher', { length: 100 }),
    room: varchar('room', { length: 6 }),
    time: lessonTime('start_time'),
    day_week: dayWeekEnum('day_week'),
    groupId: integer('group_id').references(() => groups.number, { onDelete: 'cascade' }),
    color: varchar('color', {length: 10}).default("#000")
}) 


export type Group = typeof groups.$inferSelect;
export type Lesson = typeof lessons.$inferInsert;
export type LessonSelect = typeof lessons.$inferSelect;