import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // Listen on every interface, so `npm run dev` prints a Network URL and the
    // site opens on a phone or tablet on the same Wi-Fi. Vite binds to localhost
    // only by default, which is why the Network line reads "use --host to expose".
    //
    // This does put the dev server on your local network — fine on a home or
    // office network, worth turning off on shared or public Wi-Fi. Delete this
    // block to go back to localhost-only, or set it to a single address string
    // (e.g. '192.168.1.20') to bind one interface instead of all of them.
    host: true,
  },
});
