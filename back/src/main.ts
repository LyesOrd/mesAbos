import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  const whitelist = ['http://localhost:4200', 'http://127.0.0.1:4200'];

  app.enableCors({
    origin: (origin, cb) => {
      // autorise Postman/CLI (origin null)
      if (!origin) return cb(null, true);
      if (whitelist.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // nécessaire si tu envoies des cookies ou fetch avec credentials
    optionsSuccessStatus: 204, // évite soucis IE/anciens navigateurs
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
