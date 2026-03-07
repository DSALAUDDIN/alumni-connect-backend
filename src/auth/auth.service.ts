import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma/prisma.service';
import { JwtPayload } from './jwt.strategy';
import { NotificationsService } from '../core/notifications/notifications.service';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import * as path from 'path';
import {
    RegisterDto,
    LoginDto,
    FirebaseAuthDto,
    LogoutDto,
    SendOtpDto,
    VerifyOtpDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    SubmitVerificationDto,
} from './dto/auth.dto';

const SAFE_USER_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    role: true,
    graduationYear: true,
    degree: true,
    motto: true,
    isVerified: true,
    status: true,
    createdAt: true,
};

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('An account with this email already exists');
        // Check phone duplicate if provided
        if (dto.phone) {
            const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
            if (existingPhone) throw new ConflictException('An account with this phone number already exists');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                bloodGroup: dto.bloodGroup,
                avatarUrl: dto.avatarUrl,
                graduationYear: dto.graduationYear,
                department: dto.department,
                degree: dto.degree,
                currentRole: dto.currentRole,
                currentCompany: dto.currentCompany,
                linkedinUrl: dto.linkedinUrl,
                facebookUrl: dto.facebookUrl,
                address: dto.address,
                fcmToken: dto.fcmToken,
                deviceModel: dto.deviceModel,
                lat: dto.lat,
                lng: dto.lng,
                // OTP for email verification
                otpCode,
                otpExpiry,
                status: 'PENDING',
                isVerified: false,
                isEmailVerified: false,
            },
        });
        // Send real email with OTP (crimson theme, inline logo)
        const LOGO_CID = 'alumni-logo';
        const THEME_COLOR = '#DC143C';
        // Always resolve from project root, not dist
        const LOGO_PATH = path.resolve(process.cwd(), 'assets/logo.png');
        await this.notificationsService.sendEmail({
            to: dto.email,
            subject: 'Verify your Email - Alumni Connect',
            html: `
                <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 0; margin: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;">
                        <tr>
                            <td style="background: ${THEME_COLOR}; padding: 24px 0; text-align: center;">
                                <span style="display: inline-block; background: #fff; border-radius: 50%; padding: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1.5px solid #eee;">
                                    <img src="cid:${LOGO_CID}" alt="Alumni Connect" style="height: 100px; display: block;">
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px 24px 24px 24px; text-align: center;">
                                <h2 style="color: ${THEME_COLOR}; margin-bottom: 16px;">Welcome to Alumni Connect!</h2>
                                <p style="font-size: 16px; color: #222; margin-bottom: 24px;">Your OTP code for registration is:</p>
                                <div style="font-size: 32px; font-weight: bold; color: ${THEME_COLOR}; letter-spacing: 4px; margin-bottom: 24px;">${otpCode}</div>
                                <p style="font-size: 14px; color: #555;">This code will expire in 10 minutes.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background: #f4f6fb; padding: 16px 24px; text-align: center; color: #888; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} Alumni Connect. All rights reserved.
                            </td>
                        </tr>
                    </table>
                </div>
            `,
            attachments: [
                {
                    filename: 'logo.png',
                    path: LOGO_PATH,
                    cid: LOGO_CID,
                },
            ],
        });
        return { message: 'Account created! Please check your email for the OTP verification code.' };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { ...SAFE_USER_SELECT, passwordHash: true, status: true },
        });

        if (!user) throw new UnauthorizedException('Invalid email or password');

        if (!user.passwordHash) throw new UnauthorizedException('Invalid email or password');
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password');

        if ((user as any).status === 'BLOCKED') {
            throw new UnauthorizedException('Your account has been blocked by an administrator.');
        }

        // Update device/location data upon login
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                fcmToken: dto.fcmToken ?? undefined,
                deviceModel: dto.deviceModel ?? undefined,
                lat: dto.lat ?? undefined,
                lng: dto.lng ?? undefined,
            },
        });

        const { passwordHash: _omit, ...safeUser } = user;
        const accessToken = await this.generateToken(safeUser.id, safeUser.email!, safeUser.role);

        return { message: 'Login successful', user: safeUser, accessToken };
    }

    async getMe(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: SAFE_USER_SELECT,
        });
    }

    async sendOtp(dto: SendOtpDto) {
        let user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        // 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Expires in 10 minutes
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        if (!user) {
            // Option A: Allow sign up via OTP. Create a partial user.
            // Generates a random placeholder password since it's required.
            const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-10), 12);
            user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    passwordHash,
                    isVerified: true,
                    isEmailVerified: true,
                    otpCode,
                    otpExpiry
                }
            });
        } else {
            if ((user as any).status === 'BLOCKED') {
                throw new UnauthorizedException('Your account has been blocked by an administrator.');
            }

            await this.prisma.user.update({
                where: { email: dto.email },
                data: { otpCode, otpExpiry },
            });
        }

        // Send real email with OTP (crimson theme, inline logo)
        const LOGO_CID = 'alumni-logo';
        const THEME_COLOR = '#DC143C';
        // Always resolve from project root, not dist
        const LOGO_PATH = path.resolve(process.cwd(), 'assets/logo.png');
        await this.notificationsService.sendEmail({
            to: dto.email,
            subject: 'Your Login OTP - Alumni Connect',
            html: `
                <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 0; margin: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;">
                        <tr>
                            <td style="background: ${THEME_COLOR}; padding: 24px 0; text-align: center;">
                                <span style="display: inline-block; background: #fff; border-radius: 50%; padding: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1.5px solid #eee;">
                                    <img src="cid:${LOGO_CID}" alt="Alumni Connect" style="height: 44px; display: block;">
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px 24px 24px 24px; text-align: center;">
                                <h2 style="color: ${THEME_COLOR}; margin-bottom: 16px;">Login to Alumni Connect</h2>
                                <p style="font-size: 16px; color: #222; margin-bottom: 24px;">Your OTP code is:</p>
                                <div style="font-size: 32px; font-weight: bold; color: ${THEME_COLOR}; letter-spacing: 4px; margin-bottom: 24px;">${otpCode}</div>
                                <p style="font-size: 14px; color: #555;">This code will expire in 10 minutes.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background: #f4f6fb; padding: 16px 24px; text-align: center; color: #888; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} Alumni Connect. All rights reserved.
                            </td>
                        </tr>
                    </table>
                </div>
            `,
            attachments: [
                {
                    filename: 'logo.png',
                    path: LOGO_PATH,
                    cid: LOGO_CID,
                },
            ],
        });

        return { message: 'OTP sent successfully to your email' };
    }

    async verifyOtp(dto: VerifyOtpDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { ...SAFE_USER_SELECT, otpCode: true, otpExpiry: true },
        });

        if (!user) throw new UnauthorizedException('Invalid email or OTP');

        if ((user as any).status === 'BLOCKED') {
            throw new UnauthorizedException('Your account has been blocked by an administrator.');
        }

        if (user.otpCode !== dto.code) {
            throw new UnauthorizedException('Invalid OTP code');
        }

        if (!user.otpExpiry || user.otpExpiry < new Date()) {
            throw new UnauthorizedException('OTP has expired');
        }

        // Clear OTP and update device data
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: null,
                otpExpiry: null,
                isEmailVerified: true,
                fcmToken: dto.fcmToken ?? undefined,
                deviceModel: dto.deviceModel ?? undefined,
                lat: dto.lat ?? undefined,
                lng: dto.lng ?? undefined,
            },
        });

        const { otpCode: _, otpExpiry: __, ...safeUser } = user;
        const accessToken = await this.generateToken(safeUser.id, safeUser.email!, safeUser.role);

        return { message: 'Login successful via OTP', user: safeUser, accessToken };
    }

    async submitVerification(userId: string, dto: SubmitVerificationDto) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                studentId: dto.studentId ?? undefined,
                graduationYear: dto.graduationYear ?? undefined,
                proofDocumentUrl: dto.proofDocumentUrl ?? undefined,
            },
            select: { id: true, firstName: true, lastName: true, status: true },
        });
        return { message: 'Verification documents submitted. Awaiting admin review.', user: updated };
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email }
        });

        if (!user) {
            // Always return a success message even if the user doesn't exist, for security reasons.
            return { message: 'If that email address is in our database, we will send you an email to reset your password.' };
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.prisma.user.update({
            where: { email: dto.email },
            data: { otpCode, otpExpiry },
        });

        // Send real email with OTP
        await this.notificationsService.sendEmail({
            to: dto.email,
            subject: 'Reset your Password - Alumni Connect',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Use this OTP code to proceed: <strong>${otpCode}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            `,
        });

        return { message: 'If that email address is in our database, we will send you an email to reset your password.' };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { ...SAFE_USER_SELECT, otpCode: true, otpExpiry: true },
        });

        if (!user || user.otpCode !== dto.code) {
            throw new UnauthorizedException('Invalid OTP code');
        }

        if (!user.otpExpiry || user.otpExpiry < new Date()) {
            throw new UnauthorizedException('OTP has expired');
        }

        if ((user as any).status === 'BLOCKED') {
            throw new UnauthorizedException('Your account has been blocked by an administrator.');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 12);

        // Update password, clear OTP, and return the token so they are logged in automatically
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                otpCode: null,
                otpExpiry: null,
                fcmToken: dto.fcmToken ?? undefined,
                deviceModel: dto.deviceModel ?? undefined,
                lat: dto.lat ?? undefined,
                lng: dto.lng ?? undefined,
            },
        });

        const { otpCode: _, otpExpiry: __, ...safeUser } = user;
        const accessToken = await this.generateToken(safeUser.id, safeUser.email!, safeUser.role);

        return { message: 'Password has been successfully reset', user: safeUser, accessToken };
    }

    /**
     * Firebase Integration: Verify ID Token from Mobile App
     */
    async firebaseTokenLogin(dto: FirebaseAuthDto) {
        try {
            // 0. Check if Firebase is initialized
            if (admin.apps.length === 0) {
                throw new InternalServerErrorException('Firebase is not initialized. Please check server configuration.');
            }

            // 1. Verify token with Firebase Admin SDK
            const decodedToken = await admin.auth().verifyIdToken(dto.idToken);
            const { uid, email, phone_number, name } = decodedToken;

            // 2. Check if user exists (Priority: Firebase UID > Email > Phone)
            // Note: Since we don't store firebaseUid in Prisma, we'll map by email or phone
            let user = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        email ? { email } : null,
                        phone_number ? { phone: phone_number } : null,
                        dto.phone ? { phone: dto.phone } : null
                    ].filter(Boolean) as any[]
                },
                select: SAFE_USER_SELECT,
            });

            // 3. If user doesn't exist, Create them (Auto-Registration)
            if (!user) {
                // Generate a random password since it's required in schema but not used for Firebase logins
                const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-10), 12);
                const Names = (name || 'Alumni User').split(' ');

                user = await this.prisma.user.create({
                    data: {
                        email: email || `user_${uid.slice(0, 6)}@no-email.com`,
                        passwordHash,
                        firstName: Names[0],
                        lastName: Names.slice(1).join(' ') || 'User',
                        phone: phone_number || dto.phone,
                        isVerified: true,
                        isEmailVerified: !!email,
                        fcmToken: dto.fcmToken,
                        deviceModel: dto.deviceModel,
                        lat: dto.lat,
                        lng: dto.lng,
                    },
                    select: SAFE_USER_SELECT,
                });
            } else {
                if ((user as any).status === 'BLOCKED') {
                    throw new UnauthorizedException('Your account has been blocked by an administrator.');
                }

                // Update existing user with latest device info
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        fcmToken: dto.fcmToken ?? undefined,
                        deviceModel: dto.deviceModel ?? undefined,
                        lat: dto.lat ?? undefined,
                        lng: dto.lng ?? undefined,
                    },
                    select: SAFE_USER_SELECT,
                });
            }

            // 4. Issue JWT for our backend
            const accessToken = await this.generateToken(user.id, user.email!, user.role);
            return {
                message: 'Firebase authentication successful',
                user,
                accessToken
            };
        } catch (error) {
            throw new UnauthorizedException(`Firebase verification failed: ${error.message}`);
        }
    }

    /**
     * Clear FCM token on logout to stop push notifications
     */
    async logout(userId: string, dto: LogoutDto) {
        if (dto.fcmToken) {
            // Nullify specifically if the token matches (avoid logging out other devices if not intended, though here we just nullify it if present)
            await this.prisma.user.update({
                where: { id: userId },
                data: { fcmToken: null },
            });
        }
        return { message: 'Logged out successfully' };
    }

    /**
     * Use signAsync — it has the correct object payload overload typing in @nestjs/jwt.
     */
    private async generateToken(userId: string, email: string, role: string): Promise<string> {
        const payload: JwtPayload = { sub: userId, email, role };
        return this.jwtService.signAsync(payload);
    }
}
