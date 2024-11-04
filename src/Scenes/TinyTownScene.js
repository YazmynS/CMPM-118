import '../../lib/perlin.js';  // Import Perlin.js

class TinyTown extends Phaser.Scene {
    constructor() {
        super("tinyTown");
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.atlasXML('tiny_town_tiles', 'mapPack_spritesheet.png', 'mapPack_spritesheet.xml');
    }

    create() {
        const height = 15;
        const width = 20;
        const tileSize = 64;

        this.terrainFrequency = 0.04;
        this.waterFrequency = 0.1;

        this.tiles = {
            "water": "mapTile_188.png",
            
            "UpperLeftGrass": "mapTile_006.png",
            "UpperMiddleGrass": "mapTile_007.png",
            "UpperRightGrass": "mapTile_008.png",
            
            "MiddleLeftGrass": "mapTile_021.png",
            "MiddleMiddleGrass": "mapTile_022.png",
            "MiddleRightGrass": "mapTile_023.png",
            
            "LowerLeftGrass": "mapTile_036.png",
            "LowerMiddleGrass": "mapTile_037.png",
            "LowerRightGrass": "mapTile_038.png",
            
            "UpperLeftSand": "mapTile_001.png",
            "UpperMiddleSand": "mapTile_002.png",
            "UpperRightSand": "mapTile_003.png",
            
            "MiddleLeftSand": "mapTile_016.png",
            "MiddleMiddleSand": "mapTile_017.png",
            "MiddleRightSand": "mapTile_018.png",
            "LowerLeftSand": "mapTile_031.png",
            "LowerMiddleSand": "mapTile_032.png",
            "LowerRightSand": "mapTile_033.png",
        };

        this.decor = {
            "cactus": "mapTile_035.png",
            "tree": "mapTile_040.png",
            "rock": "mapTile_049.png"
        };

        this.generateTerrain(width, height, tileSize);
        this.player = this.add.image(200, 200, 'tiny_town_tiles', 'mapTile_136.png');
        this.cursors = this.input.keyboard.createCursorKeys();

        // Instructions for controls
        document.getElementById('description').innerHTML = 
            '<h2>Press &lt; to shrink the sample window</h2>' + 
            '<h2>Press R to regenerate map</h2>' + 
            '<h2>Press &gt; to grow the sample window</h2>' +
            '<h2>Press arrow keys to move</h2>';

        this.input.keyboard.on('keydown-R', () => {
            noise.seed(Math.random());
            this.children.removeAll();
            this.generateTerrain(width, height, tileSize);
            this.player = this.add.image(200, 200, 'tiny_town_tiles', 'mapTile_136.png');
        });
    }

    generateTerrain(width, height, tileSize) {
        this.children.removeAll();
        this.terrainData = [];  // Store terrain data as a class property

        // First pass: Render all tiles as a base layer
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                let waterNoiseValue = (noise.perlin2(x * this.waterFrequency, y * this.waterFrequency) + 1) / 2;
                let terrainNoiseValue = (noise.perlin2(x * this.terrainFrequency, y * this.terrainFrequency) + 1) / 2;
    
                // Determine base tile type (either water or middle grass/sand tile)
                let baseTileKey;
                if (waterNoiseValue < 0.3) {
                    baseTileKey = this.tiles["water"];
                } else if (terrainNoiseValue < 0.5) {
                    baseTileKey = this.tiles["MiddleMiddleGrass"];
                } else {
                    baseTileKey = this.tiles["MiddleMiddleSand"];
                }

                row.push(baseTileKey);

                // Render the base tile (water, middle grass, or middle sand)
                this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', baseTileKey);
            }
            this.terrainData.push(row);
        }

        // Second pass: Apply transition tiles on top of the base layer
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileKey = this.terrainData[y][x];

                // Apply transitions to grass or sand tiles if needed
                let finalTileKey = tileKey;
                if (tileKey === this.tiles["MiddleMiddleGrass"]) {
                    finalTileKey = this.getGrassTransitionTile(x, y, this.terrainData);
                } else if (tileKey === this.tiles["MiddleMiddleSand"]) {
                    finalTileKey = this.getSandTransitionTile(x, y, this.terrainData);
                }

                // Only render transition tile if it differs from the base
                if (finalTileKey !== tileKey) {
                    this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', finalTileKey);
                }
            }
        }

        // Generate decor on top of the tiles
        this.generateDecor(this.terrainData, tileSize);
    }

    getGrassTransitionTile(x, y, terrainData) {
        const topNeighbor = this.safeGetTile(x, y - 1, terrainData);
        const bottomNeighbor = this.safeGetTile(x, y + 1, terrainData);
        const leftNeighbor = this.safeGetTile(x - 1, y, terrainData);
        const rightNeighbor = this.safeGetTile(x + 1, y, terrainData);

        const isTopWater = topNeighbor === this.tiles["water"];
        const isBottomWater = bottomNeighbor === this.tiles["water"];
        const isLeftWater = leftNeighbor === this.tiles["water"];
        const isRightWater = rightNeighbor === this.tiles["water"];

        const isTopSand = topNeighbor === this.tiles["MiddleMiddleSand"];
        const isBottomSand = bottomNeighbor === this.tiles["MiddleMiddleSand"];
        const isLeftSand = leftNeighbor === this.tiles["MiddleMiddleSand"];
        const isRightSand = rightNeighbor === this.tiles["MiddleMiddleSand"];

        // Priority for water transitions if adjacent to both sand and water
        if (isTopWater && isLeftWater) return this.tiles["UpperLeftGrass"];
        if (isTopWater && isRightWater) return this.tiles["UpperRightGrass"];
        if (isBottomWater && isLeftWater) return this.tiles["LowerLeftGrass"];
        if (isBottomWater && isRightWater) return this.tiles["LowerRightGrass"];
        if (isTopWater) return this.tiles["UpperMiddleGrass"];
        if (isBottomWater) return this.tiles["LowerMiddleGrass"];
        if (isLeftWater) return this.tiles["MiddleLeftGrass"];
        if (isRightWater) return this.tiles["MiddleRightGrass"];

        // Fallback to sand transitions if no water neighbors are present
        if (isTopSand && isLeftSand) return this.tiles["UpperLeftGrass"];
        if (isTopSand && isRightSand) return this.tiles["UpperRightGrass"];
        if (isBottomSand && isLeftSand) return this.tiles["LowerLeftGrass"];
        if (isBottomSand && isRightSand) return this.tiles["LowerRightGrass"];
        if (isTopSand) return this.tiles["UpperMiddleGrass"];
        if (isBottomSand) return this.tiles["LowerMiddleGrass"];
        if (isLeftSand) return this.tiles["MiddleLeftGrass"];
        if (isRightSand) return this.tiles["MiddleRightGrass"];

        return this.tiles["MiddleMiddleGrass"];  // Default tile if no transitions are needed
    }

    getSandTransitionTile(x, y, terrainData) {
        const topNeighbor = this.safeGetTile(x, y - 1, terrainData);
        const bottomNeighbor = this.safeGetTile(x, y + 1, terrainData);
        const leftNeighbor = this.safeGetTile(x - 1, y, terrainData);
        const rightNeighbor = this.safeGetTile(x + 1, y, terrainData);

        const isTopWater = topNeighbor === this.tiles["water"];
        const isBottomWater = bottomNeighbor === this.tiles["water"];
        const isLeftWater = leftNeighbor === this.tiles["water"];
        const isRightWater = rightNeighbor === this.tiles["water"];

        const isTopGrass = topNeighbor === this.tiles["MiddleMiddleGrass"];
        const isBottomGrass = bottomNeighbor === this.tiles["MiddleMiddleGrass"];
        const isLeftGrass = leftNeighbor === this.tiles["MiddleMiddleGrass"];
        const isRightGrass = rightNeighbor === this.tiles["MiddleMiddleGrass"];

        // Priority for water transitions if adjacent to both grass and water
        if (isTopWater && isLeftWater) return this.tiles["UpperLeftSand"];
        if (isTopWater && isRightWater) return this.tiles["UpperRightSand"];
        if (isBottomWater && isLeftWater) return this.tiles["LowerLeftSand"];
        if (isBottomWater && isRightWater) return this.tiles["LowerRightSand"];
        if (isTopWater) return this.tiles["UpperMiddleSand"];
        if (isBottomWater) return this.tiles["LowerMiddleSand"];
        if (isLeftWater) return this.tiles["MiddleLeftSand"];
        if (isRightWater) return this.tiles["MiddleRightSand"];

        // Fallback to grass transitions if no water neighbors are present
        if (isTopGrass && isLeftGrass) return this.tiles["UpperLeftSand"];
        if (isTopGrass && isRightGrass) return this.tiles["UpperRightSand"];
        if (isBottomGrass && isLeftGrass) return this.tiles["LowerLeftSand"];
        if (isBottomGrass && isRightGrass) return this.tiles["LowerRightSand"];
        if (isTopGrass) return this.tiles["UpperMiddleSand"];
        if (isBottomGrass) return this.tiles["LowerMiddleSand"];
        if (isLeftGrass) return this.tiles["MiddleLeftSand"];
        if (isRightGrass) return this.tiles["MiddleRightSand"];

        return this.tiles["MiddleMiddleSand"];  // Default tile if no transitions are needed
    }

    safeGetTile(x, y, terrainData) {
        if (y >= 0 && y < terrainData.length && x >= 0 && x < terrainData[0].length) {
            return terrainData[y][x];
        }
        return null;
    }

    generateDecor(terrainData, tileSize) {
        const decorFrequency = 0.1;
        terrainData.forEach((row, y) => {
            row.forEach((tile, x) => {
                const decorNoiseValue = (noise.perlin2(x * decorFrequency, y * decorFrequency) + 1) / 2;
                
                if (tile === this.tiles["MiddleMiddleGrass"]) {
                    if (decorNoiseValue > 0.8) {
                        this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', this.decor["tree"]);
                    }
                } else if (tile === this.tiles["MiddleMiddleSand"]) {
                    if (decorNoiseValue > 0.7) {
                        this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', this.decor["cactus"]);
                    }
                }
            });
        });
    }

    update() {
        const speed = 5;
        if (this.player) {
            let newX = this.player.x;
            let newY = this.player.y;

            if (this.cursors.left.isDown) newX -= speed;
            if (this.cursors.right.isDown) newX += speed;
            if (this.cursors.up.isDown) newY -= speed;
            if (this.cursors.down.isDown) newY += speed;

            const snappedX = Math.floor(newX / 64) * 64;
            const snappedY = Math.floor(newY / 64) * 64;

            if (this.safeGetTile(snappedX / 64, snappedY / 64, this.terrainData) !== this.tiles["water"]) {
                this.player.setPosition(newX, newY);
            }
        }
    }
}

export default TinyTown;
