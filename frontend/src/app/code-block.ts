import { Component, computed, input } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import powershell from 'highlight.js/lib/languages/powershell';
import bash from 'highlight.js/lib/languages/bash';
import ini from 'highlight.js/lib/languages/ini';
import json from 'highlight.js/lib/languages/json';

// Bundle only the grammars used by the lesson, rather than all languages.
hljs.registerLanguage('python', python);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('json', json);

export function highlightCode(code: string, language: string): string {
  return hljs.getLanguage(language)
    ? hljs.highlight(code, { language, ignoreIllegals: true }).value
    : hljs.highlightAuto(code, []).value; // Escaped plain text for unknown languages.
}

@Component({
  selector: 'app-code-block',
  template: `
    <div class="code-block">
      <div class="snippet-language">{{ language() === 'ini' ? '.ENV / CONFIGURATION' : language().toUpperCase() }}</div>
      <pre tabindex="0" [attr.aria-label]="language() + ' code example'"><code class="hljs" [innerHTML]="highlighted()"></code></pre>
    </div>
  `,
})
export class CodeBlock {
  code = input.required<string>();
  language = input('python');
  // Highlight.js escapes source text. Angular sanitizes the resulting markup
  // as well: never use bypassSecurityTrustHtml for code, including live JSON.
  highlighted = computed(() => highlightCode(this.code(), this.language()));
}
