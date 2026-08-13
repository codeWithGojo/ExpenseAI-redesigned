// Prisma schema for ExpenseAI
// Local dev uses SQLite so the project runs with zero external setup.
// For production, change provider to "postgresql" and set DATABASE_URL
// to a Postgres connection string (e.g. from Railway, Supabase, Neon).

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  name      String
  createdAt DateTime  @default(now())
  expenses  Expense[]
  incomes   Income[]
  goals     Goal[]
}

model Expense {
  id        String   @id @default(uuid())
  amount    Float
  category  String
  note      String?
  date      DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}

model Income {
  id        String   @id @default(uuid())
  amount    Float
  source    String
  date      DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}

model Goal {
  id            String   @id @default(uuid())
  title         String
  targetAmount  Float
  savedAmount   Float    @default(0)
  deadline      DateTime?
  userId        String
  user          User     @relation(fields: [userId], references: [id])
}
