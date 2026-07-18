# MaterialX Playground

MaterialX Playground is a set of tools for in-browser interactive visualization of the standard node library, preview materials in real-time 3D, and build node graphs visually, all without installing anything. Everything runs 100% client-side: no server, no account, no data leaves your browser. Shaders are generated and compiled live in your browser through the MaterialX WebAssembly modules.

> This is an independent community project. It is **not affiliated with, endorsed by, or sponsored by** the [MaterialX](https://materialx.org/) project, the Academy Software Foundation, or the Linux Foundation. In case of any discrepancy, the [MaterialX specification](https://github.com/AcademySoftwareFoundation/MaterialX/tree/main/documents/Specification) is the definitive source of truth. See [Trademarks](#trademarks) below.

Built on the MaterialX v1.39.5 WebAssembly modules (core and shader generation).

---

## Features

### 📖 Node Library & Documentation

![Node Library & Documentation](images/preview-docs.jpg)

A searchable, browsable reference for the entire MaterialX standard node library.

- **Every standard node**, organized by library (`stdlib`, `pbrlib`, `bxdf`, and more) and group (`npr`, `pbr`, etc.).
- **Per-signature documentation.** Nodes with multiple type signatures are shown individually, so you see exactly the inputs, outputs, and defaults of the variant you are searching for.
- **Port tables** generated directly from the node definitions (names, types, defaults, descriptions), with prose pulled from the MaterialX specification where available and reconstructed from the `nodedef`s where it isn't.
- **Live 3D preview** of each node, with editable parameters so you can see how inputs affect the result in real time.
- **Implementation-target matrix** showing which render targets (GLSL, ESSL, MSL, Slang, OSL, MDL) each node supports, including coverage inherited through target inheritance (e.g. MSL/Slang/ESSL falling back to the GLSL implementation), distinguished from explicit per-target overrides.
- **Shareable permalinks.** Every node has its own URL (`index.html#/<library>/<group>/<node>`), so you can link straight to a specific node's docs.
- **Export and hand-off.** Export any node (with your edited values) as a `.mtlx` document, or send it straight into the Node Graph Editor.

### 🖼️ Material Viewer

![Material Viewer](images/preview-material.jpg)

Load and inspect MaterialX materials in 3D.

- **Image-based lighting** from a built-in HDR environment (always on). A toggle shows or hides that environment as the visible backdrop; the lighting itself is unaffected either way.
- **Drag-and-drop loading.** Drop a `.mtlx` document anywhere on the page, on its own or together with loose textures, a folder of textures, or a `.zip`. Textures are matched by relative path, with a UV-checker fallback for anything unresolved.
- **Interactive viewport** with orbit (drag) and zoom (wheel/pinch), an optional turntable rotation, selectable preview geometry (shaderball / sphere / cube), a material picker when a document defines several, a save-PNG-preview button, and fullscreen.
- **Send to editor** to keep working on the current material in the Node Graph Editor.

### 🕸️ Node Graph Editor

![Node Graph Editor](images/preview-nodegraph.jpg)

Build MaterialX node graphs visually.

- **Drag-and-drop graph editing** built on React Flow, with an add-node search (filterable by type) and automatic wiring.
- **Quick insert from a wire.** Drag a connection from any port and release it over empty canvas to pick a compatible node, pre-filtered and wired up automatically.
- **Nested nodegraphs.** Enter and edit nodegraph scopes with breadcrumb navigation back out, and group the current selection into a new nodegraph in one step.
- **Undo/redo** across edits, including structural ones.
- **Live 3D preview** of the selected node or output, with a pin option to freeze the preview on a specific node while you work elsewhere.
- **Copy/paste** that preserves the relative arrangement of a group of nodes.
- **One-click automatic layout** of the current graph.
- **Document colorspace picker**, setting the fallback colorspace for inputs that don't author their own.
- **Non-destructive disconnects.** Removing a connection or deleting an upstream node restores the input's previous literal value where possible, and falls back to the definition default otherwise.
- **Document view** to inspect the generated MaterialX XML with syntax highlighting, and copy it.
- **Validate** the current document and see errors and warnings.
- **Import/export** `.mtlx`, including materials handed off from the docs previewer or the Material Viewer.

---

## Getting started

There is no build step. The app is plain static files, and the repo ships with the third-party libraries already vendored into the committed `vendor/` folder, so a fresh clone just needs to be served over HTTP (opening `index.html` directly via `file://` won't work, because the app fetches its `.jsx`, WASM, and library files). You'll need a WebGL2-capable browser.

Any static file server works, for example:

```bash
# Python 3
python -m http.server 8000

# or Node (fetches the `serve` package from npm on first use, so that
# first run needs network access — the Python command above doesn't)
npx serve .
```

Then open <http://localhost:8000/>.

> **Maintainers:** `vendor/` only needs to be regenerated after changing a pinned version in `package.json` devDependencies: `npm install && npm run vendor`. For a fully offline build that also snapshots MaterialX spec/preset/texture content and the shaderball geometry into `vendor/materialx/` (gitignored, produced on demand), run `npm run vendor:offline` instead.

### URLs / routing

The app is a hash-routed single page:

| View | URL |
| --- | --- |
| Home | `index.html` (or `#!home`) |
| Node Library & Documentation | `index.html#!docs` (deep links: `#/<library>/<group>/<node>`) |
| Material Viewer | `index.html#!viewer` |
| Node Graph Editor | `index.html#!graph` |

### Debugging

Verbose console output is off by default. Two opt-in flags can be set in the browser console (reload afterwards):

```js
localStorage.setItem('mtlxDebugShaders', '1'); // log generated GLSL, uniforms, and preview documents
localStorage.setItem('mtlxPerfLog', '1');      // log graph-editor timing (scope builds, layout, previews)
```

Remove the keys (`localStorage.removeItem(...)`) and reload to turn them off again.

---

### The standard library, spec data, and WASM modules

**`libraries/`** vendors the MaterialX standard library (`stdlib`, `pbrlib`, `bxdf`, `cmlib`, `lights`, `nprlib`, `targets`), which the WASM loads to resolve node definitions, implementations, and target inheritance.

**`js/JsMaterialXCore*` and `js/JsMaterialXGenShader*`** (`.js`/`.wasm`/`.data`, v1.39.5) are the MaterialX WebAssembly modules themselves, obtained from the official MaterialX build and committed manually. They predate, and are not managed by, `scripts/vendor.mjs`.

---

## Tech stack

- [MaterialX](https://github.com/AcademySoftwareFoundation/MaterialX) (WebAssembly build: core + GenShader)
- [React 18](https://react.dev/) (UMD) + [Babel Standalone](https://babeljs.io/docs/babel-standalone) (in-browser JSX)
- [three.js](https://threejs.org/) for the 3D previews
- [React Flow](https://reactflow.dev/) for the node graph editor, with [dagre](https://github.com/dagrejs/dagre) for automatic layout
- [Tailwind CSS](https://tailwindcss.com/) (vendored Play build) for styling
- [KaTeX](https://katex.org/) for math in the docs, [highlight.js](https://highlightjs.org/) for XML highlighting, [JSZip](https://stuk.github.io/jszip/) for zipped texture sets

All third-party JS/CSS libraries are vendored: `npm run vendor` installs pinned versions from npm (see `package.json` devDependencies) and copies the needed dist files into a committed `vendor/` folder, served locally alongside the app — no CDN requests at runtime. The one direct download is the Tailwind Play build, fetched by URL and verified against a pinned sha256. MaterialX spec/template/example documents and the shaderball geometry are the one exception: the web app fetches them from `raw.githubusercontent.com` on demand unless a local `vendor/materialx/` snapshot is present, in which case they're read from disk instead and the app performs zero network access (see `js/mtlx-assets.js`). A packaged offline build ships that snapshot.

---

## Contributing

Issues and pull requests are welcome. Please file bugs and feature requests via the [issue tracker](https://github.com/joaovbs96/MaterialXNodeDocs/issues).

## License

Released under the [Apache License 2.0](LICENSE). The MaterialX standard libraries vendored under `libraries/` are © the Academy Software Foundation and its contributors, also under the Apache License 2.0.

## Trademarks

MaterialX™ is a trademark of the Academy Software Foundation, a project of the Linux Foundation. All other trademarks are the property of their respective owners.

References to MaterialX in this project are nominative and descriptive only, used to identify the technology this tool works with. This project is **not affiliated with, endorsed by, or sponsored by** the MaterialX project, the Academy Software Foundation, or the Linux Foundation. This project does not use the MaterialX logo, and nothing here should be read as implying any official status. Where this document and any policy published by the Academy Software Foundation differ, the Foundation's policy governs.
