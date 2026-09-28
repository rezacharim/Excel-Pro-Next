/** @type {import('next').NextConfig} */
const nextConfig = {
  // Age groups were renamed for the 2026/27 season (U5-U8 → U6-U9,
  // U9-U12 → U10-U12). Old links in Google, WhatsApp and flyers keep working.
  async redirects() {
    return [
      { source: "/program/u5-u8", destination: "/program/u6-u9", permanent: true },
      { source: "/program/u9-u12", destination: "/program/u10-u12", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hrwkitzuwfwrjvrzskjb.supabase.co",
      },
    ],
    // Vercel bills every unique (image × width × quality × format) it has to
    // generate, and generates it again once the cache expires. Next 14's
    // default TTL is 60 seconds, so remote (Supabase) photos were being
    // re-transformed constantly. Photos never change once uploaded — 31 days.
    minimumCacheTTL: 2678400,
    // One output format only (this is the default; stated so nobody adds avif).
    formats: ["image/webp"],
    // Fewer candidate widths = fewer variants per image. Default is 8 + 8.
    deviceSizes: [640, 1080, 1920],
    imageSizes: [64, 128, 256, 384],
  },
};

export default nextConfig;
