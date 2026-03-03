import { Controller, Get, Patch, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { AccountStatus, UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // ── Dashboard stats ───────────────────────────────────────────────────────
    @Get('stats')
    @ApiOperation({ summary: 'Get global platform statistics' })
    getStats() {
        return this.adminService.getStats();
    }

    // ── All users (optional ?status=PENDING|ACTIVE|BLOCKED filter) ───────────
    @Get('users')
    @ApiQuery({ name: 'status', enum: AccountStatus, required: false })
    @ApiOperation({ summary: 'Get all users, optionally filtered by status' })
    getAllUsers(@Query('status') status?: AccountStatus) {
        return this.adminService.getAllUsers(status);
    }

    // ── Pending users queue (for approval) ───────────────────────────────────
    @Get('users/pending')
    @ApiOperation({ summary: 'Get all users awaiting admin approval' })
    getPendingUsers() {
        return this.adminService.getPendingUsers();
    }

    // ── Recent registrations ──────────────────────────────────────────────────
    @Get('users/recent')
    @ApiOperation({ summary: 'Get recently registered users' })
    getRecentUsers() {
        return this.adminService.getRecentUsers();
    }

    // ── Approve a pending user ────────────────────────────────────────────────
    @Patch('users/:id/approve')
    @ApiOperation({ summary: 'Approve a pending user — sets status to ACTIVE' })
    approveUser(@Param('id') id: string) {
        return this.adminService.approveUser(id);
    }

    // ── Block / Unblock a user ────────────────────────────────────────────────
    @Patch('users/:id/block')
    @ApiOperation({ summary: 'Block a user' })
    blockUser(@Param('id') id: string, @Request() req: any) {
        return this.adminService.setUserStatus(id, AccountStatus.BLOCKED, req.user);
    }

    @Patch('users/:id/unblock')
    @ApiOperation({ summary: 'Unblock a user — sets status back to ACTIVE' })
    unblockUser(@Param('id') id: string, @Request() req: any) {
        return this.adminService.setUserStatus(id, AccountStatus.ACTIVE, req.user);
    }

    // ── Change user role — SUPER_ADMIN only ───────────────────────────────────
    @Patch('users/:id/role')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Change a user role (e.g., promote to ADMIN) — SUPER_ADMIN only' })
    setUserRole(
        @Param('id') id: string,
        @Body('role') role: UserRole,
        @Request() req: any,
    ) {
        return this.adminService.setUserRole(id, role, req.user);
    }
}
