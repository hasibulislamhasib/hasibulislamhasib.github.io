import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function photoUploadPlugin(): Plugin {
  return {
    name: 'photo-upload-plugin',
    configureServer(server) {
      server.middlewares.use('/api/upload-photo', (req, res) => {
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              if (body.dataUrl) {
                const base64Data = body.dataUrl.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const publicTarget = path.resolve(__dirname, 'public/hasib-photo.jpg');
                fs.writeFileSync(publicTarget, buffer);
                const distDir = path.resolve(__dirname, 'dist');
                if (fs.existsSync(distDir)) {
                  fs.writeFileSync(path.resolve(distDir, 'hasib-photo.jpg'), buffer);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: '/hasib-photo.jpg' }));
                return;
              }
            } catch (err) {
              console.error('Error saving photo:', err);
            }
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to process image' }));
          });
          return;
        }
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), photoUploadPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
