import { TestBed } from '@angular/core/testing';
import { CodeBlock, highlightCode } from './code-block';

describe('Safe code highlighting', () => {
  beforeEach(() => { TestBed.configureTestingModule({ imports: [CodeBlock] }); });
  it('colors Python keywords and strings without changing the source text', () => {
    const fixture = TestBed.createComponent(CodeBlock);
    const code = 'async def greet():\n    return "Hello world!"';
    fixture.componentRef.setInput('code', code);
    fixture.componentRef.setInput('language', 'python');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.hljs-keyword')).not.toBeNull();
    expect(element.querySelector('.hljs-string')).not.toBeNull();
    expect(element.querySelector('code')?.textContent).toBe(code);
  });

  it('escapes untrusted code and preserves unknown languages as plain text', () => {
    const fixture = TestBed.createComponent(CodeBlock);
    const code = '<script>alert(1)</script><img src=x onerror=alert(1)>';
    fixture.componentRef.setInput('code', code);
    fixture.componentRef.setInput('language', 'unknown-language');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('script, img')).toBeNull();
    expect(element.querySelector('code')?.textContent).toBe(code);
  });

  it('supports all six lesson languages', () => {
    const samples = {
      python: 'return True', typescript: 'const x = "Hello";',
      powershell: 'if ($true) { Write-Host "Hello" }',
      bash: '# Comment\necho "Hello"', ini: 'ANTHROPIC_API_KEY=sk-ant-placeholder',
      json: '{"result": true}',
    };
    for (const [language, code] of Object.entries(samples)) {
      expect(highlightCode(code, language)).toContain('hljs-');
    }
  });
});
