import { Controller, Post, Patch, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { FirebaseAuthDto, LogoutDto, RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto, SubmitVerificationDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user with email and password' })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    @ApiResponse({ status: 409, description: 'Email already exists.' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful.' })
    @ApiResponse({ status: 401, description: 'Invalid email or password.' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Public()
    @Post('otp/send')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request OTP via email for login' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto);
    }

    @Public()
    @Post('otp/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP and login' })
    @ApiResponse({ status: 200, description: 'OTP verified, login successful.' })
    @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
    verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto);
    }

    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send an OTP to reset password' })
    @ApiResponse({ status: 200, description: 'OTP sent to email if account exists.' })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP from email and set a new password' })
    @ApiResponse({ status: 200, description: 'Password reset successful, user logged in.' })
    @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @Public()
    @Post('firebase-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Authenticate with a Firebase ID token (Phone/Google/Facebook)' })
    @ApiResponse({ status: 200, description: 'Token verified. Returns user + access token.' })
    @ApiResponse({ status: 401, description: 'Invalid token.' })
    firebaseAuth(@Body() dto: FirebaseAuthDto) {
        return this.authService.firebaseTokenLogin(dto);
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get the currently authenticated user profile' })
    @ApiResponse({ status: 200, description: 'Returns the authenticated user.' })
    getMe(@CurrentUser('id') userId: string) {
        return this.authService.getMe(userId);
    }

    @Patch('submit-verification')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Submit alumni verification documents (studentId, proofDocumentUrl)' })
    @ApiResponse({ status: 200, description: 'Documents submitted for admin review.' })
    submitVerification(@CurrentUser('id') userId: string, @Body() dto: SubmitVerificationDto) {
        return this.authService.submitVerification(userId, dto);
    }

    @Post('logout')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout user and detach FCM token for push notifications' })
    @ApiResponse({ status: 200, description: 'User explicitly logged out.' })
    logout(@CurrentUser('id') userId: string, @Body() dto: LogoutDto) {
        return this.authService.logout(userId, dto);
    }
}
