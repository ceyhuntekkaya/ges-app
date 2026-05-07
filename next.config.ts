import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Monorepo/çoklu lockfile durumunda Next yanlış root seçebiliyor.
    // Bu ayar, PostCSS/Tailwind gibi pipeline'ların doğru klasörden çalışmasını sağlar.
    root: __dirname,
  },
  async rewrites() {
    return [
      // ORVAL ürettiği client doğrudan `/v1/...` çağırıyor.
      // Browser'dan gelen bu istekleri kendi proxy route'umuza yönlendiriyoruz;
      // proxy, httpOnly cookie'deki access token'ı Authorization header'ına çevirip backend'e gönderir.
      { source: "/v1/:path*", destination: "/api/proxy/v1/:path*" },
    ];
  },
};

export default nextConfig;
