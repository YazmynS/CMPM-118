import '../../lib/perlin.js';  // Import Perlin.js 

class TinyTown extends Phaser.Scene {
    constructor() {
        super("tinyTown");
    }

    preload() {
        // Load the tilesheet and XML
        this.load.setPath("./assets/");
        this.load.atlasXML('tiny_town_tiles', 'mapPack_spritesheet.png', 'mapPack_spritesheet.xml');
    }

    create() {
        const height = 15;  // 15 rows
        const width = 20;   // 20 columns
        const tileSize = 64;

        const tiles = {
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

        const decor = {
            "cactus": "mapTile_035.png",
            "tree": "mapTile_040.png",
            "sandRock": "mapTile_049.png",
        };

        const paths = {
            "horizontal": "pathHorizontal.png",
            "vertical": "pathVertical.png",
            "cornerTopLeft": "pathCornerTopLeft.png",
            "cornerTopRight": "pathCornerTopRight.png",
            "cornerBottomLeft": "pathCornerBottomLeft.png",
            "cornerBottomRight": "pathCornerBottomRight.png"
        };

        const player = {
            "sprite": "mapTile_136.png"
        };

        this.terrainFrequency = 0.06;
        this.waterFrequency = 0.15;

        this.terrainData = this.generateTerrain(width, height, tiles);
        this.generatePaths(width, height, paths); // Generate paths over terrain
        this.generateDecor(this.terrainData, decor);
        this.player = this.add.image(200, 200, 'tiny_town_tiles', player.sprite);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown-R', () => {
            noise.seed(Math.random());
            this.children.removeAll();
            const newTerrainData = this.generateTerrain(width, height, tiles);
            this.generatePaths(width, height, paths);
            this.generateDecor(newTerrainData, decor);
            this.player = this.add.image(200, 200, 'tiny_town_tiles', player.sprite);
        });

        this.input.keyboard.on('keydown-COMMA', () => {
            this.adjustFrequency(-0.02, width, height, tiles, decor, paths);
        });

        this.input.keyboard.on('keydown-PERIOD', () => {
            this.adjustFrequency(0.02, width, height, tiles, decor, paths);
        });

        document.getElementById('description').innerHTML = 
            '<h2>Press &lt; to shrink the sample window</h2>' + 
            '<h2>Press R to regenerate map</h2>' + 
            '<h2>Press &gt; to grow the sample window</h2>' +
            '<h2>Press arrow keys to move</h2>';
    }

    adjustFrequency(amount, width, height, tiles, decor, paths) {  
        this.terrainFrequency += amount;
        this.waterFrequency += amount;

        this.terrainFrequency = Math.max(0.02, Math.min(0.5, this.terrainFrequency));
        this.waterFrequency = Math.max(0.02, Math.min(0.5, this.waterFrequency));

        const terrainData = this.generateTerrain(width, height, tiles);
        this.generatePaths(width, height, paths);
        this.generateDecor(terrainData, decor);
        this.player.setPosition(200, 200);
    }

    generateTerrain(width, height, tiles) {
        const tileSize = 64;
        const terrainFrequency = this.terrainFrequency;
        const waterFrequency = this.waterFrequency;

        this.children.removeAll();
        this.waterTiles = [];
        const terrainData = [];

        // First Pass: Generate basic terrain layout without WFC
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                let terrainNoiseValue = (noise.perlin2(x * terrainFrequency, y * terrainFrequency) + 1) / 2;
                let waterNoiseValue = (noise.perlin2(x * waterFrequency, y * waterFrequency) + 1) / 2;

                let tileKey;
                if (waterNoiseValue < 0.3) {
                    tileKey = tiles["water"];
                    this.waterTiles.push({ x: x * tileSize, y: y * tileSize });
                } else if (terrainNoiseValue < 0.5) {
                    tileKey = tiles["MiddleMiddleGrass"];
                } else {
                    tileKey = tiles["MiddleMiddleSand"];
                }

                row.push({ x: x * tileSize, y: y * tileSize, tileKey });
            }
            terrainData.push(row);
        }

        // Second Pass: Refine layout with WFC to apply transition tiles
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const currentTile = terrainData[y][x];
                if (currentTile.tileKey === tiles["MiddleMiddleGrass"]) {
                    currentTile.tileKey = this.getGrassTileWithWFC(x, y, terrainData, tiles);
                }
                // Replace the image with the refined tile
                this.add.image(currentTile.x, currentTile.y, 'tiny_town_tiles', currentTile.tileKey);
            }
        }

        return terrainData;
    }

    generatePaths(width, height, paths) {
        // Example path generation
        for (let y = 3; y < height - 3; y++) {
            this.add.image(4 * 64, y * 64, 'tiny_town_tiles', paths["vertical"]);
            this.add.image((width - 5) * 64, y * 64, 'tiny_town_tiles', paths["vertical"]);
        }
        for (let x = 3; x < width - 3; x++) {
            this.add.image(x * 64, 4 * 64, 'tiny_town_tiles', paths["horizontal"]);
            this.add.image(x * 64, (height - 5) * 64, 'tiny_town_tiles', paths["horizontal"]);
        }
        // Add corners or intersections as needed
    }

    generateDecor(terrainData, decor) {
        const decorFrequency = 0.1;
        const cactusThreshold = 0.7;
        const treeThreshold = 0.7;
        const rockThreshold = 0.7;

        terrainData.forEach((row) => {
            row.forEach((cell) => {
                let decorNoiseValue = (noise.perlin2(cell.x * decorFrequency, cell.y * decorFrequency) + 1) / 2;

                if (cell.tileKey === "mapTile_017.png") {
                    if (decorNoiseValue > cactusThreshold) {
                        this.add.image(cell.x, cell.y, 'tiny_town_tiles', decor["cactus"]);
                    }
                } else if (cell.tileKey === "mapTile_022.png") {
                    if (decorNoiseValue > treeThreshold) {
                        this.add.image(cell.x, cell.y, 'tiny_town_tiles', decor["tree"]);
                    }
                } else if (cell.tileKey === "mapTile_188.png") {
                    if (decorNoiseValue > rockThreshold) {
                        this.add.image(cell.x, cell.y, 'tiny_town_tiles', decor["sandRock"]);
                    }
                }
            });
        });
    }

    getTileWithWFC(x, y, terrainNoiseValue, waterNoiseValue, terrainData, tiles) {
        if (waterNoiseValue < 0.3) {
            return tiles["water"];
        }

        if (terrainNoiseValue < 0.5) {
            return this.getGrassTileWithWFC(x, y, terrainData, tiles);
        } else {
            return tiles["MiddleMiddleSand"];
        }
    }

    safeGetNeighborTile(x, y, terrainData) {
        if (y >= 0 && y < terrainData.length && x >= 0 && x < terrainData[0].length) {
            return terrainData[y][x].tileKey;
        }
        return null;
    }

    getGrassTileWithWFC(x, y, terrainData, tiles) {
        const topNeighbor = this.safeGetNeighborTile(x, y - 1, terrainData);
        const bottomNeighbor = this.safeGetNeighborTile(x, y + 1, terrainData);
        const leftNeighbor = this.safeGetNeighborTile(x - 1, y, terrainData);
        const rightNeighbor = this.safeGetNeighborTile(x + 1, y, terrainData);

        const isTopSand = topNeighbor && topNeighbor.includes("Sand");
        const isBottomSand = bottomNeighbor && bottomNeighbor.includes("Sand");
        const isLeftSand = leftNeighbor && leftNeighbor.includes("Sand");
        const isRightSand = rightNeighbor && rightNeighbor.includes("Sand");

        if (isTopSand && isLeftSand && isRightSand) return tiles["UpperLeftGrass"];
        if (isTopSand && isRightSand) return tiles["UpperRightGrass"];
        if (isBottomSand && isLeftSand) return tiles["LowerLeftGrass"];
        if (isBottomSand && isRightSand) return tiles["LowerRightGrass"];
        if (isTopSand) return tiles["UpperMiddleGrass"];
        if (isBottomSand) return tiles["LowerMiddleGrass"];
        if (isLeftSand) return tiles["MiddleLeftGrass"];
        if (isRightSand) return tiles["MiddleRightGrass"];

        return tiles["MiddleMiddleGrass"];
    }
    
    isWaterTile(x, y) {
        return this.waterTiles.some(tile => {
            const snappedX = Math.floor(x / 64) * 64;
            const snappedY = Math.floor(y / 64) * 64;
            return tile.x === snappedX && tile.y === snappedY;
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

            if (!this.isWaterTile(newX, newY)) {
                this.player.setPosition(newX, newY);
            }
        }
    }
}

export default TinyTown;
