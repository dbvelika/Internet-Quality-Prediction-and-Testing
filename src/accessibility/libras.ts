// ACESSIBILIDADE — peças do VLibras que não dependem de React: endereços, a página da WebView e o widget web.
// O VLibras (Governo Federal) é um widget para páginas web: um script em https://vlibras.gov.br/app cria um
// avatar que traduz o texto da página para Libras. Aqui ele é usado de duas formas:
//   • no navegador (Expo Web): o widget oficial é colocado na própria página;
//   • no celular: o widget roda numa página mínima dentro de uma WebView, com o texto da tela atual.
import { LIBRAS_TEXT } from '../content/texts';

export const VLIBRAS_APP_URL = 'https://vlibras.gov.br/app';
export const VLIBRAS_ORIGIN = 'https://vlibras.gov.br';

/** Estrutura que o widget espera encontrar (a mesma do guia de integração do VLibras). */
const WIDGET_MARKUP =
  '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** A WebView só pode ficar em páginas do próprio VLibras (ou em branco). */
export function isAllowedLibrasUrl(url: string): boolean {
  if (url === 'about:blank') return true;
  return /^https:\/\/([a-z0-9-]+\.)*vlibras\.gov\.br(\/|$)/i.test(url);
}

/** Página mostrada na WebView: o texto da tela, um parágrafo por linha, e o widget do VLibras. */
export function buildLibrasHtml(lines: string[]): string {
  const paragraphs = (lines.length > 0 ? lines : [LIBRAS_TEXT.empty])
    .map((line) => `<p class="t">${escapeHtml(line)}</p>`)
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(LIBRAS_TEXT.title)}</title>
<style>
  body { margin: 0; padding: 16px 16px 96px; font: 18px/1.5 Roboto, Arial, sans-serif; color: #0f172a; background: #fff; }
  h1 { font-size: 20px; margin: 0 0 8px; }
  .hint { margin: 0 0 16px; font-size: 15px; color: #475569; }
  .t { margin: 0 0 12px; padding: 12px 14px; background: #f1f5f9; border-radius: 12px; }
  .erro { margin: 0 0 16px; padding: 12px 14px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; color: #991b1b; }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(LIBRAS_TEXT.pageTitle)}</h1>
  <p class="hint">${escapeHtml(LIBRAS_TEXT.pageHint)}</p>
  <p id="libras-error" class="erro" role="alert" hidden>${escapeHtml(LIBRAS_TEXT.offline)}</p>
  ${paragraphs}
</main>
<div vw class="enabled">${WIDGET_MARKUP}</div>
<script src="${VLIBRAS_APP_URL}/vlibras-plugin.js"></script>
<script>
  (function () {
    if (window.VLibras) {
      new window.VLibras.Widget('${VLIBRAS_APP_URL}');
    } else {
      document.getElementById('libras-error').hidden = false;
    }
  })();
</script>
</body>
</html>`;
}

/**
 * Diagnóstico: roda dentro da WebView antes do widget e avisa o app de cada requisição que o VLibras faz
 * (tradução, dicionário de sinais), com o resultado, e de erros de JavaScript. Serve para descobrir por que o
 * avatar soletra em vez de sinalizar: o guia do VLibras diz que ele soletra quando a API de tradução falha
 * ou quando a palavra não está no dicionário.
 */
export const DIAGNOSTIC_SCRIPT = `
(function () {
  if (window.__librasDiag) return;
  window.__librasDiag = true;
  function post(kind, text) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ kind: kind, text: String(text).slice(0, 400) })); } catch (e) {}
  }
  function short(url) {
    try { var u = new URL(url, location.href); return u.host + u.pathname; } catch (e) { return String(url).slice(0, 80); }
  }
  try {
    var canvas = document.createElement('canvas');
    post('info', 'WebGL2: ' + (canvas.getContext('webgl2') ? 'sim' : 'não') + ' | WebGL: ' + (canvas.getContext('webgl') ? 'sim' : 'não'));
    post('info', 'Navegador: ' + navigator.userAgent);
  } catch (e) {}

  var open = XMLHttpRequest.prototype.open;
  var send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__diag = { label: method + ' ' + short(url), started: Date.now() };
    return open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    var info = this.__diag;
    if (info) {
      if (typeof body === 'string') info.body = body.slice(0, 80);
      this.addEventListener('loadend', function () {
        var ok = this.status >= 200 && this.status < 400;
        var text = info.label + ' → ' + (this.status || 'falhou') + ' (' + (Date.now() - info.started) + ' ms)';
        if (info.body) text += ' enviou: ' + info.body;
        if (info.body && (this.responseType === '' || this.responseType === 'text')) text += ' recebeu: ' + String(this.responseText).slice(0, 80);
        post(ok ? 'ok' : 'erro', text);
      });
    }
    return send.apply(this, arguments);
  };

  if (window.fetch) {
    var nativeFetch = window.fetch;
    window.fetch = function (input, init) {
      var label = ((init && init.method) || 'GET') + ' ' + short(typeof input === 'string' ? input : input && input.url);
      var started = Date.now();
      return nativeFetch.apply(this, arguments).then(
        function (res) { post(res.ok ? 'ok' : 'erro', label + ' → ' + res.status + ' (' + (Date.now() - started) + ' ms)'); return res; },
        function (err) { post('erro', label + ' → falhou: ' + err); throw err; }
      );
    };
  }

  window.addEventListener('error', function (e) { post('erro', 'Erro de JavaScript: ' + e.message); });
  window.addEventListener('unhandledrejection', function (e) { post('erro', 'Promessa rejeitada: ' + (e.reason && e.reason.message || e.reason)); });
  var consoleError = console.error;
  console.error = function () { post('erro', 'console: ' + Array.prototype.join.call(arguments, ' ')); return consoleError.apply(console, arguments); };
})();
true;
`;

export type LibrasLogKind = 'ok' | 'erro' | 'info';
export interface LibrasLogMessage {
  kind: LibrasLogKind;
  text: string;
}

/** Lê o que o script de diagnóstico enviou; qualquer outra mensagem é ignorada. */
export function parseLogMessage(data: string): LibrasLogMessage | null {
  try {
    const message = JSON.parse(data) as { kind?: unknown; text?: unknown };
    const { kind, text } = message;
    if ((kind === 'ok' || kind === 'erro' || kind === 'info') && typeof text === 'string') return { kind, text };
  } catch {
    // não era uma mensagem do diagnóstico
  }
  return null;
}

export const WEB_ROOT_ID = 'vlibras-root';

interface WindowWithVLibras extends Window {
  VLibras?: { Widget: new (rootPath: string) => unknown };
}

/** Navegador: coloca o widget oficial na página (uma vez só) e o inicia quando o script termina de carregar. */
export function mountWebWidget(doc: Document, win: Window): void {
  if (doc.getElementById(WEB_ROOT_ID)) return;

  const root = doc.createElement('div');
  root.id = WEB_ROOT_ID;
  root.setAttribute('vw', '');
  root.className = 'enabled';
  root.innerHTML = WIDGET_MARKUP;
  doc.body.appendChild(root);

  const script = doc.createElement('script');
  script.src = `${VLIBRAS_APP_URL}/vlibras-plugin.js`;
  script.async = true;
  script.onload = () => {
    const { VLibras } = win as WindowWithVLibras;
    if (VLibras) new VLibras.Widget(VLIBRAS_APP_URL);
  };
  doc.body.appendChild(script);
}
