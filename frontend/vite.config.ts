import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT ?? "5173";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8010";

// Set TUNNEL_HMR_PORT=443 when running behind ngrok (or any TLS-terminating
// tunnel) so the browser's HMR websocket reconnects on the tunnel's public
// port instead of the local dev port. Left unset, HMR behaves exactly as
// before for plain localhost development.
const tunnelHmrPort = process.env.TUNNEL_HMR_PORT ? Number(process.env.TUNNEL_HMR_PORT) : undefined;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    // Vite 7 rejects any request whose Host header isn't localhost/127.0.0.1
    // unless it's listed here (DNS-rebinding protection). ngrok's hostname
    // isn't local, so it 403s without this. The leading "." matches any
    // subdomain, which covers ngrok's free-tier random subdomain on every
    // restart, not just today's specific one.
    allowedHosts: [".ngrok-free.dev", ".ngrok.io", ".ngrok.app"],
    // ngrok terminates TLS on 443 and proxies to this dev server's port —
    // without a client-port override, the HMR websocket tries to reconnect
    // on `port` (5173) through the tunnel and fails (page still loads, but
    // live-reload won't work). Only applied when TUNNEL_HMR_PORT is set, so
    // plain `npm run dev` on localhost is unaffected.
    hmr: tunnelHmrPort ? { clientPort: tunnelHmrPort } : undefined,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
  },
});
