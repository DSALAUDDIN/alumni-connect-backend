import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    IsInt,
    IsNumber,
    IsDateString,
    MaxLength,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Shared Device Info ───────────────────────────────────────────────────────
export class DeviceInfoDto {
    @ApiPropertyOptional({ example: 'fcm_token_string_here' })
    @IsOptional()
    @IsString()
    fcmToken?: string;

    @ApiPropertyOptional({ example: 'Samsung Galaxy S23' })
    @IsOptional()
    @IsString()
    deviceModel?: string;

    @ApiPropertyOptional({ example: 23.7941 })
    @IsOptional()
    @IsNumber()
    lat?: number;

    @ApiPropertyOptional({ example: 90.4043 })
    @IsOptional()
    @IsNumber()
    lng?: number;
}

// ─── Register ─────────────────────────────────────────────────────────────────
export class RegisterDto extends DeviceInfoDto {
    // Personal
    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiPropertyOptional({ example: '+8801712345678' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: '1998-05-15' })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @ApiPropertyOptional({ example: 'O+' })
    @IsOptional()
    @IsString()
    @MaxLength(5)
    bloodGroup?: string;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
    @IsOptional()
    @IsString()
    avatarUrl?: string;

    // Alumni Verification
    @ApiPropertyOptional({ example: 2018 })
    @IsOptional()
    @IsInt()
    graduationYear?: number;

    @ApiPropertyOptional({ example: 'Science' })
    @IsOptional()
    @IsString()
    department?: string;

    @ApiPropertyOptional({ example: 'BSc in CSE' })
    @IsOptional()
    @IsString()
    degree?: string;

    // Professional & Contact
    @ApiPropertyOptional({ example: 'Software Engineer' })
    @IsOptional()
    @IsString()
    currentRole?: string;

    @ApiPropertyOptional({ example: 'Tech Inc.' })
    @IsOptional()
    @IsString()
    currentCompany?: string;

    @ApiPropertyOptional({ example: 'linkedin.com/in/johndoe' })
    @IsOptional()
    @IsString()
    linkedinUrl?: string;

    @ApiPropertyOptional({ example: 'facebook.com/johndoe' })
    @IsOptional()
    @IsString()
    facebookUrl?: string;

    @ApiPropertyOptional({ example: 'House 12, Road 5, Mirpur, Dhaka' })
    @IsOptional()
    @IsString()
    address?: string;
}

// ─── Submit Batch Verification (after OTP verify in signup) ──────────────────
export class SubmitVerificationDto {
    @ApiPropertyOptional({ example: '18-3600-1' })
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiPropertyOptional({ example: 2018 })
    @IsOptional()
    @IsInt()
    graduationYear?: number;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/docs/id-card.pdf' })
    @IsOptional()
    @IsString()
    proofDocumentUrl?: string;
}

// ─── Login ────────────────────────────────────────────────────────────────────
export class LoginDto extends DeviceInfoDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    password: string;
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────
export class SendOtpDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export class VerifyOtpDto extends DeviceInfoDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '847291' })
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code: string;
}

// ─── Firebase Auth ────────────────────────────────────────────────────────────
export class FirebaseAuthDto extends DeviceInfoDto {
    @ApiProperty({ description: 'Firebase ID Token from phone/Google/Facebook auth' })
    @IsString()
    idToken: string;

    @ApiPropertyOptional({ example: '+8801700000000' })
    @IsOptional()
    @IsString()
    phone?: string;
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export class LogoutDto {
    @ApiPropertyOptional({ description: 'FCM token to clear on logout' })
    @IsOptional()
    @IsString()
    fcmToken?: string;
}

// ─── Forgot Password ────────────────────────────────────────────────────────
export class ForgotPasswordDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto extends DeviceInfoDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '847291' })
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code: string;

    @ApiProperty({ example: 'NewSecurePass123!' })
    @IsString()
    @MinLength(8)
    newPassword: string;
}
