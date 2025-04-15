# Hexagon Game

A simple hexagon-based game built with TypeScript and HTML5 Canvas.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript files:
```bash
npm run build
```

3. Start the development server:
```bash
npm run serve
```

4. Open your browser and navigate to `http://localhost:8080`

## Development

To watch for TypeScript file changes and automatically rebuild:
```bash
npm run watch
```

## Project Structure

- `src/` - TypeScript source files
  - `game.ts` - Main game initialization
  - `blackGrid.ts` - Black hexagon grid implementation
  - `redTiles.ts` - Red tiles implementation
- `dist/` - Compiled JavaScript files (generated after build)
- `index.html` - Main HTML file 