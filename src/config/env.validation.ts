import { IsEnum, IsNumber, IsString, validateSync, IsOptional, MinLength } from 'class-validator';
import { plainToInstance } from 'class-transformer';

enum Environment {
    Development = 'development',
    Production = 'production',
    Staging = 'staging',
    Test = 'test',
}

class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsNumber()
    PORT: number;

    @IsString()
    DATABASE_URL: string;

    @IsString()
    REDIS_HOST: string;

    @IsNumber()
    REDIS_PORT: number;

    @IsOptional()
    @IsString()
    REDIS_PASSWORD?: string;

    @IsString()
    @MinLength(32)
    JWT_SECRET: string;

    @IsString()
    JWT_EXPIRES_IN: string;

    @IsString()
    CLOUDINARY_CLOUD_NAME: string;

    @IsString()
    CLOUDINARY_API_KEY: string;

    @IsString()
    CLOUDINARY_API_SECRET: string;

    @IsString()
    CLOUDINARY_URL: string;

    @IsString()
    SMTP_HOST: string;

    @IsNumber()
    SMTP_PORT: number;

    @IsString()
    SMTP_USER: string;

    @IsString()
    SMTP_PASS: string;

    @IsString()
    SMTP_FROM: string;

    @IsString()
    FIREBASE_PROJECT_ID: string;

    @IsString()
    FIREBASE_CLIENT_EMAIL: string;

    @IsString()
    FIREBASE_PRIVATE_KEY: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}
