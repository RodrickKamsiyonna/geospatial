/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      'mapbox-gl': 'mapbox-gl',
    },
  },
};
   
export default nextConfig;
