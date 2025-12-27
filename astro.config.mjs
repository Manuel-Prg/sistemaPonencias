// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Necesario para que el middleware funcione
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react()]
});
