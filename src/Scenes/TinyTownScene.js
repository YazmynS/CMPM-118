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
            "MiddleMiddleGrass": "mapTile_022.png",
            "MiddleMiddleSand": "mapTile_017.png",
            "UpperLeftGrass": "mapTile_006.png",
            "UpperMiddleGrass": "mapTile_007.png",
            "UpperRightGrass": "mapTile_008.png",
            "MiddleLeftGrass": "mapTile_021.png",
            "MiddleRightGrass": "mapTile_023.png",
            "LowerLeftGrass": "mapTile_036.png",
            "LowerMiddleGrass": "mapTile_037.png",
            "LowerRightGrass": "mapTile_038.png",
            "UpperLeftSand": "mapTile_001.png",
            "UpperMiddleSand": "mapTile_002.png",
            "UpperRightSand": "mapTile_003.png",
            "MiddleLeftSand": "mapTile_016.png",
            "MiddleRightSand": "mapTile_018.png",
            "LowerLeftSand": "mapTile_031.png",
            "LowerMiddleSand": "mapTile_032.png",
            "LowerRightSand": "mapTile_033.png"
        };

        this.decor = {
            "cactus": "mapTile_035.png",
            "tree": "mapTile_040.png",
            "rock": "mapTile_049.png"
        };

        // Display controls including <>, W, and N functionality
        document.getElementById('description').innerHTML =
            '<h2>Press &lt; to shrink the sample window</h2>' +
            '<h2>Press &gt; to grow the sample window</h2>' +
            '<h2>Push W to regenerate with base WFC</h2>' +
            '<h2>Push N to regenerate with Noise Coherence</h2>' +
            '<h2>Press arrow keys to move</h2>';

        // Keyboard events to switch between generation methods
        this.input.keyboard.on('keydown-W', () => {
            noise.seed(Math.random());
            this.children.removeAll();
            this.generateTerrainBase(width, height, tileSize);  // Base WFC generation
            this.placePlayer();
        });

        this.input.keyboard.on('keydown-N', () => {
            noise.seed(Math.random());
            this.children.removeAll();
            this.generateTerrainNoiseCoherence(width, height, tileSize);  // Noise coherence generation
            this.placePlayer();
        });

        // Initial generation using the base WFC method
        this.generateTerrainBase(width, height, tileSize);
        this.placePlayer();
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    // Base WFC terrain generation (current method)
    generateTerrainBase(width, height, tileSize) {
        this.terrainData = [];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                let waterNoise = (noise.perlin2(x * this.waterFrequency, y * this.waterFrequency) + 1) / 2;
                let terrainNoise = (noise.perlin2(x * this.terrainFrequency, y * this.terrainFrequency) + 1) / 2;

                let tileKey;
                if (waterNoise < 0.3) {
                    tileKey = this.tiles["water"];
                } else if (terrainNoise < 0.5) {
                    tileKey = this.tiles["MiddleMiddleGrass"];
                } else {
                    tileKey = this.tiles["MiddleMiddleSand"];
                }

                row.push(tileKey);
                this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', tileKey);
            }
            this.terrainData.push(row);
        }

        // Apply adjacency-based transitions
        this.applyTransitions(width, height, tileSize);
        this.generateDecor(this.terrainData, tileSize);
    }

    // Noise coherence terrain generation
    generateTerrainNoiseCoherence(width, height, tileSize) {
        this.terrainData = [];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                let waterNoise = (noise.perlin2(x * this.waterFrequency, y * this.waterFrequency) + 1) / 2;
                let terrainNoise = (noise.perlin2(x * this.terrainFrequency, y * this.terrainFrequency) + 1) / 2;
                let transitionNoise = (noise.perlin2(x * 0.02, y * 0.02) + 1) / 2;  // Lower frequency for blending

                let tileKey;
                if (waterNoise < 0.3 + transitionNoise * 0.1) {
                    tileKey = this.tiles["water"];
                } else if (terrainNoise < 0.5 + transitionNoise * 0.15) {
                    tileKey = this.tiles["MiddleMiddleGrass"];
                } else {
                    tileKey = this.tiles["MiddleMiddleSand"];
                }

                row.push(tileKey);
                this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', tileKey);
            }
            this.terrainData.push(row);
        }

        // Apply adjacency-based transitions
        this.applyTransitions(width, height, tileSize);
        this.generateDecor(this.terrainData, tileSize);
    }

    applyTransitions(width, height, tileSize) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileKey = this.terrainData[y][x];

                let finalTileKey = tileKey;
                if (tileKey === this.tiles["MiddleMiddleGrass"]) {
                    finalTileKey = this.getGrassTransitionTile(x, y, this.terrainData);
                } else if (tileKey === this.tiles["MiddleMiddleSand"]) {
                    finalTileKey = this.getSandTransitionTile(x, y, this.terrainData);
                }

                if (finalTileKey !== tileKey) {
                    this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', finalTileKey);
                }
            }
        }
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

        if (isTopWater && isLeftWater) return this.tiles["UpperLeftGrass"];
        if (isTopWater && isRightWater) return this.tiles["UpperRightGrass"];
        if (isBottomWater && isLeftWater) return this.tiles["LowerLeftGrass"];
        if (isBottomWater && isRightWater) return this.tiles["LowerRightGrass"];
        if (isTopWater) return this.tiles["UpperMiddleGrass"];
        if (isBottomWater) return this.tiles["LowerMiddleGrass"];
        if (isLeftWater) return this.tiles["MiddleLeftGrass"];
        if (isRightWater) return this.tiles["MiddleRightGrass"];

        return this.tiles["MiddleMiddleGrass"];
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

        if (isTopWater && isLeftWater) return this.tiles["UpperLeftSand"];
        if (isTopWater && isRightWater) return this.tiles["UpperRightSand"];
        if (isBottomWater && isLeftWater) return this.tiles["LowerLeftSand"];
        if (isBottomWater && isRightWater) return this.tiles["LowerRightSand"];
        if (isTopWater) return this.tiles["UpperMiddleSand"];
        if (isBottomWater) return this.tiles["LowerMiddleSand"];
        if (isLeftWater) return this.tiles["MiddleLeftSand"];
        if (isRightWater) return this.tiles["MiddleRightSand"];

        return this.tiles["MiddleMiddleSand"];
    }

    generateDecor(terrainData, tileSize) {
        const decorFrequency = 0.1;
        terrainData.forEach((row, y) => {
            row.forEach((tile, x) => {
                const decorNoiseValue = (noise.perlin2(x * decorFrequency, y * decorFrequency) + 1) / 2;
                
                if (tile === this.tiles["MiddleMiddleGrass"]) {
                    if (decorNoiseValue > 0.485) {
                        this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', this.decor["tree"]);
                    }
                } else if (tile === this.tiles["MiddleMiddleSand"]) {
                    if (decorNoiseValue > 0.58) {
                        this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', this.decor["cactus"]);
                    }
                }
                else if (tile === this.tiles["water"]){
                    if (decorNoiseValue > 0.27) {
                        this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', this.decor["rock"]);
                    }
                }
            });
        });
    }

    safeGetTile(x, y, terrainData = this.terrainData) {
        if (terrainData && y >= 0 && y < terrainData.length && x >= 0 && x < terrainData[0].length) {
            return terrainData[y][x];
        }
        return null;
    }

    placePlayer() {
        this.player = this.add.image(200, 200, 'tiny_town_tiles', 'mapTile_136.png');
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

            if (this.safeGetTile(snappedX / 64, snappedY / 64) !== this.tiles["water"]) {
                this.player.setPosition(newX, newY);
            }
        }
    }
}

export default TinyTown;
