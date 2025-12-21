# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

```
sistemaPonencias
├─ .nojekyll
├─ astro.config.mjs
├─ env.d.ts
├─ package-lock.json
├─ package.json
├─ public
│  ├─ favicon
│  │  └─ favicon_io
│  │     ├─ android-chrome-192x192.png
│  │     ├─ android-chrome-512x512.png
│  │     ├─ apple-touch-icon.png
│  │     ├─ favicon-16x16.png
│  │     ├─ favicon-32x32.png
│  │     ├─ favicon.ico
│  │     └─ site.webmanifest
│  ├─ favicon.svg
│  ├─ icon-logo.png
│  ├─ icono.png
│  ├─ logo-dacity
│  │  ├─ logo-dacity.png
│  │  ├─ logo-negro-verde.jpg
│  │  ├─ logo-negro.jpg
│  │  ├─ logo-negro_bordes_blancos-sinFondo.png
│  │  ├─ logo-negro_bordes_blancos.jpg
│  │  └─ logo-negro_bordes_verde.jpg
│  ├─ Logos UJAT
│  │  └─ Logos UJAT
│  │     ├─ Logo 1 blanco.png
│  │     ├─ Logo 1 negro.png
│  │     ├─ logo 1 verde.png
│  │     ├─ logo 2 blanco.png
│  │     ├─ logo 2 negro.png
│  │     ├─ logo 2 verde.png
│  │     ├─ logo 3 blanco.png
│  │     ├─ logo 3 negro.png
│  │     ├─ logo 3 verde.png
│  │     ├─ logo 4 blanco.png
│  │     ├─ logo 4 negro.png
│  │     ├─ logo 4 verde.png
│  │     ├─ logo 5 blanco.png
│  │     ├─ logo 5 negro.png
│  │     └─ logo 5 verde.png
│  ├─ logo_mujeres
│  │  ├─ logo_mueres_blanco.png
│  │  ├─ logo_mujeres_base.png
│  │  ├─ logo_mujeres_base.svg
│  │  ├─ logo_mujeres_contorno.png
│  │  ├─ logo_mujeres_contorno.svg
│  │  ├─ logo_mujeres_letras.png
│  │  └─ logo_mujeres_letras.svg
│  └─ SOLO - LOGO -NEGRO.png
├─ README.md
└─ src
   ├─ assets
   │  ├─ astro.svg
   │  └─ background.svg
   ├─ components
   │  ├─ auth
   │  │  ├─ LoginForm.ts
   │  │  ├─ resetPassword.ts
   │  │  └─ SigninForm.ts
   │  ├─ moderador
   │  │  └─ dashboard.ts
   │  ├─ ponente
   │  │  ├─ dashboard.ts
   │  │  ├─ datosPonente.ts
   │  │  ├─ modalEscritor.ts
   │  │  └─ registroPonencia.ts
   │  ├─ revisor
   │  │  ├─ dashboard.ts
   │  │  ├─ datosRevisor.ts
   │  │  └─ ponencia.ts
   │  ├─ shared
   │  │  ├─ AdminLayout.astro
   │  │  ├─ botonMobile.astro
   │  │  ├─ headerLayout.astro
   │  │  └─ logosLayout.astro
   │  ├─ utils.ts
   │  └─ Welcome.astro
   ├─ layouts
   │  └─ Layout.astro
   ├─ lib
   │  ├─ firebase
   │  │  └─ config.ts
   │  ├─ models
   │  │  ├─ auth.ts
   │  │  ├─ ponencia.ts
   │  │  ├─ ponente.ts
   │  │  ├─ revisor.ts
   │  │  ├─ sala.ts
   │  │  └─ user.ts
   │  └─ services
   │     ├─ auth
   │     │  └─ auth.service.ts
   │     ├─ ponencias
   │     │  └─ ponencia.service.ts
   │     ├─ revisor
   │     │  └─ revisor.services.ts
   │     ├─ salas
   │     │  └─ sala.service.ts
   │     └─ user
   │        └─ user.service.ts
   ├─ middleware
   │  └─ auth.middleware.ts
   ├─ pages
   │  ├─ admin
   │  │  ├─ asignarModeradores.astro
   │  │  ├─ asignarPonencias.astro
   │  │  ├─ asignarSalas.astro
   │  │  ├─ salasPonencias.astro
   │  │  └─ vistaAdmin.astro
   │  ├─ index.astro
   │  ├─ moderador
   │  │  └─ salasMod.astro
   │  ├─ ponente
   │  │  ├─ dashboardEscritor.astro
   │  │  ├─ datosPonencia.astro
   │  │  ├─ datosPonente.astro
   │  │  ├─ editarPonencia.astro
   │  │  └─ registroValido.astro
   │  ├─ recuperarPassword.astro
   │  ├─ registro.astro
   │  ├─ revisor
   │  │  ├─ datosRevisor.astro
   │  │  ├─ revisor.astro
   │  │  └─ [id].astro
   │  └─ scripts
   │     ├─ AdminRevisorPanel.ts
   │     ├─ AdminSalasPanel.ts
   │     ├─ AdminUsersPanel.ts
   │     └─ PonenciaHandlers.ts
   └─ styles
      ├─ animations.css
      ├─ buttons.css
      ├─ form.css
      ├─ layout.css
      ├─ logos.css
      ├─ main.css
      ├─ mobile-menu.css
      ├─ reset.css
      ├─ salasModStyles.css
      ├─ styles.css
      ├─ stylesDatos.css
      ├─ stylesPassword.css
      ├─ stylesPendientes.css
      ├─ stylesRegistro.css
      ├─ stylesRegistroValido.css
      ├─ stylesRevisarPonencia.css
      ├─ stylesRevisor.css
      ├─ targetAdmin.css
      ├─ variables.css
      └─ vistaAdmin.css

```