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
            "LowerRightGrass": "mapTile_038.png"
        };

        this.decor = {
            "cactus": "mapTile_035.png",
            "tree": "mapTile_040.png",
            "rock": "mapTile_049.png"
        };

        this.generateTerrain(width, height, tileSize);
        this.player = this.add.image(200, 200, 'tiny_town_tiles', 'mapTile_136.png');
        this.cursors = this.input.keyboard.createCursorKeys();

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

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                let terrainNoiseValue = (noise.perlin2(x * this.terrainFrequency, y * this.terrainFrequency) + 1) / 2;
                let waterNoiseValue = (noise.perlin2(x * this.waterFrequency, y * this.waterFrequency) + 1) / 2;
                
                let tileKey;

                if (waterNoiseValue < 0.3) {
                    tileKey = this.tiles["water"];
                } else if (terrainNoiseValue < 0.5) {
                    tileKey = this.tiles["MiddleMiddleGrass"];
                } else {
                    tileKey = this.tiles["MiddleMiddleSand"];
                }

                row.push(tileKey);
                this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', tileKey);
            }
            this.terrainData.push(row);
        }

        this.applyWFCTransitions(width, height, this.terrainData, tileSize);
        this.generateDecor(this.terrainData, tileSize);
    }

    applyWFCTransitions(width, height, terrainData, tileSize) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const currentTile = terrainData[y][x];
                
                if (currentTile === this.tiles["MiddleMiddleGrass"]) {
                    const newTile = this.getGrassTransitionTile(x, y, terrainData);
                    if (newTile) {
                        terrainData[y][x] = newTile;
                        this.add.image(x * tileSize, y * tileSize, 'tiny_town_tiles', newTile);
                    }
                }
            }
        }
    }

    getGrassTransitionTile(x, y, terrainData) {
        const topNeighbor = this.safeGetTile(x, y - 1, terrainData);
        const bottomNeighbor = this.safeGetTile(x, y + 1, terrainData);
        const leftNeighbor = this.safeGetTile(x - 1, y, terrainData);
        const rightNeighbor = this.safeGetTile(x + 1, y, terrainData);

        const isTopSand = topNeighbor === this.tiles["MiddleMiddleSand"];
        const isBottomSand = bottomNeighbor === this.tiles["MiddleMiddleSand"];
        const isLeftSand = leftNeighbor === this.tiles["MiddleMiddleSand"];
        const isRightSand = rightNeighbor === this.tiles["MiddleMiddleSand"];

        if (isTopSand && isLeftSand) return this.tiles["UpperLeftGrass"];
        if (isTopSand && isRightSand) return this.tiles["UpperRightGrass"];
        if (isBottomSand && isLeftSand) return this.tiles["LowerLeftGrass"];
        if (isBottomSand && isRightSand) return this.tiles["LowerRightGrass"];
        if (isTopSand) return this.tiles["UpperMiddleGrass"];
        if (isBottomSand) return this.tiles["LowerMiddleGrass"];
        if (isLeftSand) return this.tiles["MiddleLeftGrass"];
        if (isRightSand) return this.tiles["MiddleRightGrass"];

        return null;
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
