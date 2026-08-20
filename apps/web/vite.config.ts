import { reactRouter } from "@react-router/dev/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL;
  }
  if (env.SESSION_SECRET) {
    process.env.SESSION_SECRET = env.SESSION_SECRET;
  }
  return {
    plugins: [reactRouter(), tsconfigPaths()],
    server: {
      port: 3000,
    },
    ssr: {
      external: ["@prisma/client", ".prisma/client"],
    },
  };
});