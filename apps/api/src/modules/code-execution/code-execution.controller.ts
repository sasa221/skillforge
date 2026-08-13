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
}
