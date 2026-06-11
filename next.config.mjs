/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["twilio", "nodemailer", "tronweb", "ethers", "pg"],
  },
};

export default nextConfig;
