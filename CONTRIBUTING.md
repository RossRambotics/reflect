# Reflect Development and Contributing Guide

> This guide is still in its early stages and under development.

We welcome community contributions to Reflect.

## Development

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) +
  [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) +
  [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Simulation and mock data

When developing without access to a real robot, you can use
[simulation](https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/index.html) or mock data. The
project already contains basic mock data that can be used with `MockNetworkTablesSource`. To use mock mode create
`.env.local` file in this folder and add the following:

```
VITE_MOCK_MODE=1
```

You can disable mock mode by either removing the variable or setting it to an empty value:

```
VITE_MOCK_MODE=
```

## Notable dependencies

### Drag-and-drop

The [dnd kit](https://dndkit.com/) is used to facilitate drag-and-drop functionality.

### Dashboard

The main dashboard view is built with parts from [xyflow](https://reactflow.dev/),
[re-resizable](https://github.com/bokuweb/re-resizable) and [dnd kit](https://dndkit.com/).

`ViewportPane` implements a generic scalable viewport with pan and zoom functionality. It is a simplified version of
[ZoomPane](https://github.com/xyflow/xyflow/blob/main/packages/react/src/container/ZoomPane/index.tsx) component built
with vanilla helpers from [@xyflow/system](https://www.npmjs.com/package/@xyflow/system) package.

`DashboardView` is the key component responsible for widgets layout and user interaction. It combines
[dnd kit](https://docs.dndkit.com/) and [re-resizable](https://github.com/bokuweb/re-resizable) packages functionality
to provide dragging and resizing of widgets. `ViewportPane` acts as the underlying visual container.

## Updating dependencies

### Tauri

First run `cargo outdated` in `src-tauri` to check for the latest versions of
[tauri](https://crates.io/crates/tauri/versions) and [tauri-build](https://crates.io/crates/tauri-build/versions).
Alternatively you can check the versions on crates.io website.

Then update corresponding versions `src-tauri/Cargo.toml`:

```diff
[build-dependencies]
-tauri-build = { version = "1.5.4", ...
+tauri-build = { version = "2.0.1", ...

[dependencies]
-tauri = { version = "1.7.2", ...
+tauri = { version = "2.0.1", ...
```

Then run `cargo update` in `src-tauri`.

> **IMPORTANT:** keep Tauri npm package versions in sync with rust package versions.
