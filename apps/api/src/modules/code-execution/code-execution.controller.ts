import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
}
