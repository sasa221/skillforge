import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CodeExecutionService, ExecuteCodeDto } from './code-execution.service';

@ApiTags('code-execution')
@Controller('code')
export class CodeExecutionController {
  constructor(private readonly codeExecution: CodeExecutionService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Execute code in sandbox and return stdout/test results' })
  @Post('execute')
  async execute(@Body() dto: ExecuteCodeDto) {
    return this.codeExecution.executeCode(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Get list of interactive code battle challenges' })
  @Get('challenges')
  async getChallenges() {
    return this.codeExecution.getChallenges();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Submit solution for code challenge evaluation' })
  @Post('challenges/:id/submit')
  async submitChallenge(
    @Param('id') id: string,
    @Body() body: { code: string; language: any },
  ) {
    return this.codeExecution.submitChallenge(id, body.code, body.language ?? 'javascript');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Get active peer live coding rooms' })
  @Get('rooms')
  async getRooms() {
    return this.codeExecution.getCodeRooms();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Create a new live code room' })
  @Post('rooms')
  async createRoom(@Body() body: { title: string; language: any; hostName?: string; initialCode?: string }) {
    return this.codeExecution.createCodeRoom(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Get live code room details' })
  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    return this.codeExecution.getCodeRoom(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Sync code buffer or send chat message in live room' })
  @Post('rooms/:id/sync')
  async syncRoom(
    @Param('id') id: string,
    @Body() body: { code?: string; message?: { sender: string; text: string } },
  ) {
    return this.codeExecution.syncCodeRoom(id, body);
  }
}
