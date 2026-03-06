export const ENV = {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/elysia_db?schema=public',
    JWT_SECRET: process.env.JWT_SECRET || 'super-secret-key-change-me',
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
};
