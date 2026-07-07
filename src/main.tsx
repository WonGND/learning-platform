import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// 도트 폰트 self-host: CDN 대신 npm 패키지에서 필요한 서체만 번들 (오프라인·SRI 이슈 제거)
import './styles/fonts.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
