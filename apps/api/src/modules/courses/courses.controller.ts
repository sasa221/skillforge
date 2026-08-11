import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '../../prisma-enums';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @ApiOkResponse({ description: 'List published courses' })
  @Get()
  async list() {
    return this.courses.listPublished();
  }

  @ApiOkResponse({ description: 'Get published course detail (modules/lessons summary)' })
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.courses.getPublishedBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Create course' })
  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Update course' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courses.update(id, dto);
  }

  @ApiOkResponse({ description: 'Get course reviews and average rating' })
  @Get(':courseId/reviews')
  async getReviews(@Param('courseId') courseId: string) {
    return this.courses.getCourseReviews(courseId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Submit course review' })
  @Post(':courseId/reviews')
  async addReview(@Req() req: any, @Param('courseId') courseId: string, @Body() dto: { rating: number; comment: string }) {
    return this.courses.addCourseReview(req.user.sub, courseId, dto);
  }

  @ApiOkResponse({ description: 'Get course discussion questions and Q&A' })
  @Get(':courseId/discussions')
  async getDiscussions(@Param('courseId') courseId: string) {
    return this.courses.getCourseDiscussions(courseId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Post new question to course discussion board' })
  @Post(':courseId/discussions')
  async createDiscussion(@Req() req: any, @Param('courseId') courseId: string, @Body() dto: { title: string; content: string }) {
    return this.courses.createCourseDiscussion(req.user.sub, courseId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Reply to course discussion question' })
  @Post(':courseId/discussions/:discussionId/replies')
  async addReply(@Req() req: any, @Param('courseId') courseId: string, @Param('discussionId') discussionId: string, @Body() dto: { content: string }) {
    return this.courses.addDiscussionReply(req.user.sub, courseId, discussionId, dto);
  }

  @ApiOkResponse({ description: 'Get course announcements' })
  @Get(':courseId/announcements')
  async getAnnouncements(@Param('courseId') courseId: string) {
    return this.courses.getCourseAnnouncements(courseId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Create course announcement' })
  @Post(':courseId/announcements')
  async createAnnouncement(@Req() req: any, @Param('courseId') courseId: string, @Body() dto: { title: string; message: string; isUrgent?: boolean }) {
    return this.courses.createCourseAnnouncement(req.user.sub, courseId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Delete course (soft delete)' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.courses.softDelete(id);
  }
}

