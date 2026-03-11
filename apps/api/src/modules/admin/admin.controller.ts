import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '../../prisma-enums';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { UpdateCourseDto } from '../courses/dto/update-course.dto';
import { CreateLessonDto } from '../lessons/dto/create-lesson.dto';
import { UpdateLessonDto } from '../lessons/dto/update-lesson.dto';
import { CreateModuleDto } from '../modules/dto/create-module.dto';
import { UpdateModuleDto } from '../modules/dto/update-module.dto';
import { CreateSkillDto } from '../skills/dto/create-skill.dto';
import { UpdateSkillDto } from '../skills/dto/update-skill.dto';
import { AdminService } from './admin.service';
import { AdminUsersQueryDto } from './dto/admin-users.query';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateLessonAdminDto } from './dto/update-lesson-admin.dto';
import { UpsertQuizDto } from './dto/upsert-quiz.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @ApiOkResponse({ description: 'Admin overview metrics' })
  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @ApiOkResponse({ description: 'Content stats by status' })
  @Get('content/stats')
  contentStats() {
    return this.admin.contentStats();
  }

  @ApiOkResponse({ description: 'Paginated users list' })
  @Get('users')
  users(@Query() query: AdminUsersQueryDto) {
    return this.admin.users(query);
  }

  // ===== Skills =====
  @ApiOkResponse({ description: 'List skills (all statuses)' })
  @Get('skills')
  skills() {
    return this.admin.adminListSkills();
  }

  @ApiOkResponse({ description: 'Create skill' })
  @Post('skills')
  createSkill(@Body() dto: CreateSkillDto) {
    return this.admin.adminCreateSkill(dto);
  }

  @ApiOkResponse({ description: 'Update skill' })
  @Patch('skills/:id')
  updateSkill(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.admin.adminUpdateSkill(id, dto);
  }

  @ApiOkResponse({ description: 'Delete/Archive skill' })
  @Delete('skills/:id')
  deleteSkill(@Param('id') id: string) {
    return this.admin.adminDeleteSkill(id);
  }

  // ===== Courses =====
  @ApiOkResponse({ description: 'List courses (all statuses)' })
  @Get('courses')
  courses() {
    return this.admin.adminListCourses();
  }

  @ApiOkResponse({ description: 'Get course by id' })
  @Get('courses/:id')
  course(@Param('id') id: string) {
    return this.admin.adminGetCourse(id);
  }

  @ApiOkResponse({ description: 'Create course' })
  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.admin.adminCreateCourse(dto);
  }

  @ApiOkResponse({ description: 'Update course' })
  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.admin.adminUpdateCourse(id, dto);
  }

  @ApiOkResponse({ description: 'Delete/Archive course' })
  @Delete('courses/:id')
  deleteCourse(@Param('id') id: string) {
    return this.admin.adminDeleteCourse(id);
  }

  // ===== Modules =====
  @ApiOkResponse({ description: 'List modules for course' })
  @Get('courses/:courseId/modules')
  courseModules(@Param('courseId') courseId: string) {
    return this.admin.adminCourseModules(courseId);
  }

  @ApiOkResponse({ description: 'Create module' })
  @Post('courses/:courseId/modules')
  createModule(@Param('courseId') courseId: string, @Body() dto: CreateModuleDto) {
    return this.admin.adminCreateModule(courseId, dto);
  }

  @ApiOkResponse({ description: 'Get module by id' })
  @Get('modules/:id')
  module(@Param('id') id: string) {
    return this.admin.adminGetModule(id);
  }

  @ApiOkResponse({ description: 'Update module' })
  @Patch('modules/:id')
  updateModule(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.admin.adminUpdateModule(id, dto);
  }

  @ApiOkResponse({ description: 'Delete/Archive module' })
  @Delete('modules/:id')
  deleteModule(@Param('id') id: string) {
    return this.admin.adminDeleteModule(id);
  }

  // ===== Lessons =====
  @ApiOkResponse({ description: 'List lessons for module' })
  @Get('modules/:moduleId/lessons')
  moduleLessons(@Param('moduleId') moduleId: string) {
    return this.admin.adminModuleLessons(moduleId);
  }

  @ApiOkResponse({ description: 'Get lesson by id (with blocks)' })
  @Get('lessons/:id')
  lesson(@Param('id') id: string) {
    return this.admin.adminGetLesson(id);
  }

  @ApiOkResponse({ description: 'Create lesson' })
  @Post('modules/:moduleId/lessons')
  createLesson(@Param('moduleId') moduleId: string, @Body() dto: CreateLessonDto) {
    return this.admin.adminCreateLesson(moduleId, dto);
  }

  @ApiOkResponse({ description: 'Update lesson (supports blocks replacement if blocks provided)' })
  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonAdminDto) {
    return this.admin.adminUpdateLesson(id, dto as any);
  }

  @ApiOkResponse({ description: 'Delete/Archive lesson' })
  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.admin.adminDeleteLesson(id);
  }

  // ===== Quizzes / Questions =====
  @ApiOkResponse({ description: 'Get quiz for lesson (admin)' })
  @Get('lessons/:lessonId/quiz')
  lessonQuiz(@Param('lessonId') lessonId: string) {
    return this.admin.adminGetLessonQuiz(lessonId);
  }

  @ApiOkResponse({ description: 'Create/update quiz for lesson' })
  @Post('lessons/:lessonId/quiz')
  upsertLessonQuiz(@Param('lessonId') lessonId: string, @Body() dto: UpsertQuizDto) {
    return this.admin.adminCreateOrUpdateLessonQuiz(lessonId, dto);
  }

  @ApiOkResponse({ description: 'Get quiz by id (admin)' })
  @Get('quizzes/:id')
  quiz(@Param('id') id: string) {
    return this.admin.adminGetQuiz(id);
  }

  @ApiOkResponse({ description: 'Update quiz' })
  @Patch('quizzes/:id')
  updateQuiz(@Param('id') id: string, @Body() dto: UpsertQuizDto) {
    return this.admin.adminUpdateQuiz(id, dto);
  }

  @ApiOkResponse({ description: 'Delete/Archive quiz' })
  @Delete('quizzes/:id')
  deleteQuiz(@Param('id') id: string) {
    return this.admin.adminDeleteQuiz(id);
  }

  @ApiOkResponse({ description: 'Create question for quiz' })
  @Post('quizzes/:quizId/questions')
  createQuestion(@Param('quizId') quizId: string, @Body() dto: CreateQuestionDto) {
    return this.admin.adminCreateQuestion(quizId, dto);
  }

  @ApiOkResponse({ description: 'Update question' })
  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.admin.adminUpdateQuestion(id, dto);
  }

  @ApiOkResponse({ description: 'Delete question (soft delete)' })
  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.admin.adminDeleteQuestion(id);
  }
}

