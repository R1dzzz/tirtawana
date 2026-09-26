# Asset Guide (placeholder pipeline)

Pixel scale: 16px tiles, player 16x24, pixelArt:true + roundPixels.
Palette anchors: grass #3d6b2f, water #2a5a8a, path #8a7a5a, UI gold #f0d040,
night #0a1030. Generate textures at BootScene before any scene uses them.
Final art pipeline: Aseprite → PNG → atlas → replace generator calls 1:1 by key.
