import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Served from the domain root (https://78cxrlos.github.io/). To host under a
  // sub-path instead (a project repo), set this to '/repo-name/'.
  base: '/',
  build: {
    // three + R3F are large; split them so the app shell loads quickly and the
    // 3D chunk can be cached separately.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Path-based (not the object form, which would also drag shared deps
        // like zustand/react into the 3D chunk and force it to load eagerly).
        manualChunks(id) {
          // Vite/Rollup runtime helpers are shared by every chunk; keep them out of the 3D chunk.
          if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'vendor';
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/three\//.test(id)) return 'three';
          if (/node_modules\/(@react-three|postprocessing|three-stdlib|troika|maath|n8ao|camera-controls|three-mesh-bvh|meshline|stats-gl|@monogrid)/.test(id)) return 'r3f';
          if (/node_modules\/gsap\//.test(id)) return 'gsap';
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run|zustand|use-sync-external-store)\//.test(id)) return 'vendor';
          return undefined;
        },
      },
    },
  },
});
