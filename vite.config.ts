// vite.config.ts (프로덕션용)
import { defineConfig } from "vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import vue from "@vitejs/plugin-vue";
// import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
    plugins: [
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
        vue(),
        // basicSsl(),
    ],
    server: {
        // https: true,
        port: 1000,
    },
});
