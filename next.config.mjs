/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "hrwkitzuwfwrjvrzskjb.supabase.co",
        },
      ],
    },
  };
  
  export default nextConfig;