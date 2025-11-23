
# React Frontend (with Tailwind CSS)

## Quickstart
```bash
cd my-react-tailwind-app
npm install
npm run dev
```

## Structure
- `src/` — React source code
- `public/` — Static assets

## Linting
```bash
npm run lint
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration
## Integrating with the backend

During development the frontend needs to call the backend endpoint at `http://localhost:8000/process`.

Options:
- Keep the backend running on port 8000 and enable CORS in the backend (already supported).
- Or configure a dev proxy in `vite.config.js` to forward API calls to the backend.

Example: POST a file (multipart/form-data) to `/process` with the `file` field and optional
`translate_to` form field. The endpoint returns JSON with `text`, `entities`, `summary`, and `translation`.

If you want, I can add a small example React component that uploads a file and displays the response.

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
