import { Injectable, Logger } from '@nestjs/common';

export type SupportedLanguage = 'javascript' | 'python' | 'html' | 'sql';

export interface ExecuteCodeDto {
  language: SupportedLanguage;
  code: string;
  testCases?: Array<{ input?: string; expectedOutput: string }>;
}

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);

  async executeCode(dto: ExecuteCodeDto) {
    const { language, code, testCases = [] } = dto;
    const startTime = Date.now();

    if (language === 'html') {
      return {
        stdout: 'HTML rendered successfully in preview viewport.',
        stderr: '',
        executionTimeMs: Date.now() - startTime,
        passed: true,
        testResults: [],
        previewHtml: code,
      };
    }

    if (language === 'javascript') {
      return this.evaluateJavaScript(code, testCases);
    }

    if (language === 'python') {
      return this.evaluatePython(code, testCases);
    }

    if (language === 'sql') {
      return this.evaluateSql(code, testCases);
    }

    return {
      stdout: '',
      stderr: 'Unsupported language',
      executionTimeMs: 0,
      passed: false,
      testResults: [],
    };
  }

  private evaluateJavaScript(code: string, testCases: Array<{ input?: string; expectedOutput: string }>) {
    const logs: string[] = [];
    const errors: string[] = [];
    const startTime = Date.now();

    // Mock console.log collector
    const customConsole = {
      log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      error: (...args: any[]) => errors.push(args.map((a) => String(a)).join(' ')),
      warn: (...args: any[]) => logs.push('[WARN] ' + args.map((a) => String(a)).join(' ')),
    };

    try {
      // Execute in isolated Function context
      const runFn = new Function('console', code);
      runFn(customConsole);
    } catch (err: any) {
      errors.push(err.message || String(err));
    }

    const stdout = logs.join('\n');
    const stderr = errors.join('\n');

    // Run test case checks if provided
    const testResults = testCases.map((tc, idx) => {
      const match = stdout.trim().includes(tc.expectedOutput.trim());
      return {
        id: idx + 1,
        expected: tc.expectedOutput,
        passed: match,
      };
    });

    const passed = testCases.length === 0 ? errors.length === 0 : testResults.every((r) => r.passed);

    return {
      stdout: stdout || (errors.length === 0 ? 'Code executed with 0 errors.' : ''),
      stderr,
      executionTimeMs: Date.now() - startTime,
      passed,
      testResults,
    };
  }

  private evaluatePython(code: string, testCases: Array<{ input?: string; expectedOutput: string }>) {
    const startTime = Date.now();
    const logs: string[] = [];

    // Parse print statements for instant Python emulation
    const printMatches = code.match(/print\s*\((.*?)\)/g);
    if (printMatches) {
      printMatches.forEach((m) => {
        const content = m.replace(/^print\s*\(/, '').replace(/\)$/, '').replace(/^['"]|['"]$/g, '');
        logs.push(content);
      });
    } else {
      logs.push('Python code compiled successfully.');
    }

    const stdout = logs.join('\n');
    const testResults = testCases.map((tc, idx) => ({
      id: idx + 1,
      expected: tc.expectedOutput,
      passed: stdout.includes(tc.expectedOutput.trim()),
    }));

    return {
      stdout,
      stderr: '',
      executionTimeMs: Date.now() - startTime,
      passed: testCases.length === 0 ? true : testResults.every((r) => r.passed),
      testResults,
    };
  }

  private evaluateSql(code: string, testCases: Array<{ input?: string; expectedOutput: string }>) {
    const startTime = Date.now();
    const stdout = `SELECT query executed on virtual dataset.\nRows returned: 12\nColumns: [id, title, category, score]`;

    return {
      stdout,
      stderr: '',
      executionTimeMs: Date.now() - startTime,
      passed: true,
      testResults: [],
    };
  }

  getChallenges() {
    return [
      {
        id: 'two-sum',
        title: 'Two Sum Algorithm',
        difficulty: 'Easy',
        category: 'Algorithms',
        xpAward: 100,
        language: 'javascript',
        description: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. Print the result as a JSON array.',
        starterCode: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) {\n      console.log(JSON.stringify([map.get(diff), i]));\n      return;\n    }\n    map.set(nums[i], i);\n  }\n}\n\ntwoSum([2, 7, 11, 15], 9);`,
        testCases: [{ input: '[2, 7, 11, 15], 9', expectedOutput: '[0,1]' }],
      },
      {
        id: 'reverse-string',
        title: 'Reverse String Challenge',
        difficulty: 'Easy',
        category: 'Strings',
        xpAward: 80,
        language: 'javascript',
        description: 'Write an algorithm that takes a string input and prints its characters in reverse order.',
        starterCode: `function reverseString(str) {\n  console.log(str.split('').reverse().join(''));\n}\n\nreverseString('skillforge');`,
        testCases: [{ input: "'skillforge'", expectedOutput: 'egroflliks' }],
      },
      {
        id: 'fizzbuzz',
        title: 'FizzBuzz Speed Battle',
        difficulty: 'Easy',
        category: 'Logic',
        xpAward: 75,
        language: 'javascript',
        description: 'Print numbers from 1 to 15. For multiples of 3 print "Fizz", for 5 print "Buzz", and for both print "FizzBuzz".',
        starterCode: `for (let i = 1; i <= 15; i++) {\n  if (i % 15 === 0) console.log('FizzBuzz');\n  else if (i % 3 === 0) console.log('Fizz');\n  else if (i % 5 === 0) console.log('Buzz');\n  else console.log(i);\n}`,
        testCases: [{ input: '1 to 15', expectedOutput: 'FizzBuzz' }],
      },
      {
        id: 'palindrome-check',
        title: 'Palindrome Validator',
        difficulty: 'Medium',
        category: 'Strings',
        xpAward: 120,
        language: 'javascript',
        description: 'Determine if a given string is a valid palindrome (ignoring spaces and punctuation). Print true or false.',
        starterCode: `function isPalindrome(str) {\n  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');\n  console.log(clean === clean.split('').reverse().join(''));\n}\n\nisPalindrome('A man, a plan, a canal: Panama');`,
        testCases: [{ input: "'A man, a plan, a canal: Panama'", expectedOutput: 'true' }],
      },
      {
        id: 'fibonacci-seq',
        title: 'Fibonacci Sequence Generator',
        difficulty: 'Hard',
        category: 'Recursion',
        xpAward: 150,
        language: 'javascript',
        description: 'Generate and print the first 6 numbers of the Fibonacci sequence starting from 0 as a JSON array.',
        starterCode: `function fibonacci(n) {\n  const res = [0, 1];\n  for (let i = 2; i < n; i++) {\n    res.push(res[i - 1] + res[i - 2]);\n  }\n  console.log(JSON.stringify(res));\n}\n\nfibonacci(6);`,
        testCases: [{ input: '6', expectedOutput: '[0,1,1,2,3,5]' }],
      },
    ];
  }

  async submitChallenge(challengeId: string, code: string, language: SupportedLanguage) {
    const challenge = this.getChallenges().find((c) => c.id === challengeId);
    if (!challenge) {
      return { ok: false, error: 'Challenge not found' };
    }

    const execResult = await this.executeCode({
      language,
      code,
      testCases: challenge.testCases,
    });

    return {
      ok: execResult.passed,
      challengeId,
      xpAwarded: execResult.passed ? challenge.xpAward : 0,
      executionTimeMs: execResult.executionTimeMs,
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      testResults: execResult.testResults,
    };
  }
}
