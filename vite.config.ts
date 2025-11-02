// import { defineConfig } from 'vite'
// import AutoImport from 'unplugin-auto-import/vite'
// import Components from 'unplugin-vue-components/vite'
// import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// import vue from '@vitejs/plugin-vue'
//
// export default defineConfig({
//   plugins: [
//     AutoImport({
//       resolvers: [ElementPlusResolver()],
//     }),
//     Components({
//       resolvers: [ElementPlusResolver()],
//     }),
//     vue()
//   ],
//   server: {
//     port: 1000,
//     proxy: {
//       '/api': {
//         target: 'http://heojineee.ddnsking.com:1400',
//         changeOrigin: true,
//         secure: false,
//         cookieDomainRewrite: {
//           '*': 'localhost'
//         },
//         configure: (proxy) => {
//           proxy.on('proxyRes', (proxyRes: any, req: any) => {
//             console.log('=== PROXY RESPONSE ===')
//             console.log('Original set-cookie:', proxyRes.headers['set-cookie'])
//
//             if (proxyRes.headers['set-cookie']) {
//               const cookies = Array.isArray(proxyRes.headers['set-cookie'])
//                   ? proxyRes.headers['set-cookie']
//                   : [proxyRes.headers['set-cookie']]
//
//               proxyRes.headers['set-cookie'] = cookies.map((cookie: string) => {
//                 let newCookie = cookie
//
//                 // Domain 처리: 있으면 localhost로 변경, 없으면 추가
//                 if (newCookie.includes('Domain=')) {
//                   newCookie = newCookie.replace(/Domain=[^;]+/gi, 'Domain=localhost')
//                 } else {
//                   newCookie = newCookie + '; Domain=localhost'
//                 }
//
//                 // Secure 속성 제거 (localhost에서는 HTTPS가 아니므로)
//                 newCookie = newCookie.replace(/;\s*Secure/gi, '')
//
//                 // SameSite=None을 Lax로 변경 (localhost에서 더 안전)
//                 newCookie = newCookie.replace(/SameSite=None/gi, 'SameSite=Lax')
//
//                 return newCookie
//               })
//
//               console.log('Modified set-cookie:', proxyRes.headers['set-cookie'])
//             }
//
//             // CORS 헤더도 명시적으로 설정
//             proxyRes.headers['Access-Control-Allow-Credentials'] = 'true'
//             proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:1000'
//             proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Cookie'
//             proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
//           })
//         }
//       }
//     }
//   }
// })

// =================================================================
// vite.config.ts (프로덕션용)
import { defineConfig } from "vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
        vue(),
    ],
});
