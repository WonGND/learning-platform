import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 프로덕션 빌드에만 CSP meta 태그를 주입한다.
 * (개발 모드는 @vitejs/plugin-react 의 인라인 preamble 때문에 strict CSP와 충돌)
 * - script-src 'self': 외부/인라인 스크립트 차단 (XSS 방어선)
 * - style-src 'unsafe-inline': 진행 바 등 인라인 style 속성에 필요
 * - 폰트·이미지 전부 self-host이므로 외부 origin 불허
 */
function injectCsp(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), injectCsp()],
  base: './',
  resolve: {
    alias: {
      // fonts.css 에서 galmuri 패키지의 woff2만 선택적으로 참조하기 위한 별칭
      '~galmuri': 'galmuri/dist',
    },
  },
})
