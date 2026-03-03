import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import configuration from './config/configuration';

// Core Global Modules
import { PrismaModule } from './core/prisma/prisma.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { RedisModule } from './core/redis/redis.module';
import { CloudinaryModule } from './core/cloudinary/cloudinary.module';

// Feature Modules
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FeedModule } from './feed/feed.module';
import { GroupsModule } from './groups/groups.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { EventsModule } from './events/events.module';
import { ChatModule } from './chat/chat.module';
import { EmergencyModule } from './emergency/emergency.module';
import { JobsModule } from './jobs/jobs.module';
import { MentorshipModule } from './mentorship/mentorship.module';
import { ProjectsModule } from './projects/projects.module';
import { AdminModule } from './admin/admin.module';

// Guards
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // Environment Variables — must be first
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      // Load .env.development locally; on Render (production) only env vars are needed
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'staging')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        CLOUDINARY_URL: Joi.string().optional(),
      }),
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ── Core Global ──────────────────────────────
    PrismaModule,         // @Global — DB everywhere
    NotificationsModule,  // @Global — FCM + email everywhere
    RedisModule,          // @Global — cache + presence everywhere
    CloudinaryModule,     // @Global — file uploads everywhere

    // ── Feature Modules ──────────────────────────
    AuthModule,
    HealthModule,
    UsersModule,          // avatar upload
    FeedModule,           // media upload
    GroupsModule,
    MarketplaceModule,    // item image upload
    EventsModule,
    ChatModule,           // Socket.io gateway
    EmergencyModule,
    JobsModule,
    MentorshipModule,
    ProjectsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }
