import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Временно отключаем проверку типов (только для продакшена)
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Временно отключаем ESLint при сборке
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
