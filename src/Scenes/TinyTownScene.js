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
        // Define map dimensions (in tiles)
        const height = 15;  // 15 rows
        const width = 20;   // 20 columns

        // Define terrain tiles
        const tiles = {
            "water": "mapTile_188.png",           // Water tile
            "MiddleMiddleGrass": "mapTile_022.png", // Grass tile
            "MiddleMiddleSand": "mapTile_017.png"  // Sand tile
        };

        const decor = {
            "cactus": "mapTile_035.png",
            "tree": "mapTile_040.png",
            "sandRock": "mapTile_049.png",
        };

        const player = {
            "sprite": "mapTile_136.png"  // Player sprite
        };

        // Store the initial noise frequency for map generation
        this.terrainFrequency = 0.06;  // Lower frequency for larger, more distinct regions
        this.waterFrequency = 0.15;    // Slightly higher frequency for sporadic water placement

        // Generate the initial map
        this.terrainData = this.generateTerrain(width, height, tiles);

        // Generate decor based on terrain
        this.generateDecor(this.terrainData, decor);

        // Add the player sprite at position (200, 200) after terrain and decor generation
        this.player = this.add.image(200, 200, 'tiny_town_tiles', player.sprite);

        // Capture cursor keys (arrow keys)
        this.cursors = this.input.keyboard.createCursorKeys(); 

        // Regenerate the map with 'R' key and re-add the player
        this.input.keyboard.on('keydown-R', () => {
            noise.seed(Math.random());  // Generate new seed
            const newTerrainData = this.generateTerrain(width, height, tiles);  // Regenerate terrain
            this.generateDecor(newTerrainData, decor);  // Regenerate decor

            // Re-add the player sprite after regenerating the map
            this.player = this.add.image(200, 200, 'tiny_town_tiles', player.sprite);
        });

        // Shrinking and Growing Window
        this.input.keyboard.on('keydown-COMMA', () => {  // < key
            this.adjustFrequency(-0.02, width, height, tiles, decor);
        });

        this.input.keyboard.on('keydown-PERIOD', () => {  // > key
            this.adjustFrequency(0.02, width, height, tiles, decor);
        });

        // Display Directions
        document.getElementById('description').innerHTML = 
            '<h2>Press &lt; to shrink the sample window</h2>' + 
            '<h2>Press R to regenerate map</h2>' + 
            '<h2>Press &gt; to grow the sample window</h2>';
    }

    // Adjust frequency and regenerate terrain and decor without changing seed
    adjustFrequency(amount, width, height, tiles, decor) {  // Accept 'decor' as a parameter
        this.terrainFrequency += amount;    
        this.waterFrequency += amount;    
    
        this.terrainFrequency = Math.max(0.02, Math.min(0.5, this.terrainFrequency));  
        this.waterFrequency = Math.max(0.02, Math.min(0.5, this.waterFrequency));  
    
        const terrainData = this.generateTerrain(width, height, tiles);
        this.generateDecor(terrainData, decor);

        this.player = this.add.image(200, 200, 'tiny_town_tiles', 'mapTile_136.png');
    }

    // Generate terrain and store water tile locations
    generateTerrain(width, height, tiles) {
        const tileSize = 45;
        const terrainFrequency = this.terrainFrequency;
        const waterFrequency = this.waterFrequency;
        let yPosition = 0;

        this.children.removeAll();
        this.waterTiles = [];  // Array to store water tile positions

        const terrainData = [];

        for (let y = 0; y < height; y++) {
            let xPosition = 0;
            const row = [];
            for (let x = 0; x < width; x++) {
                let terrainNoiseValue = (noise.perlin2(x * terrainFrequency, y * terrainFrequency) + 1) / 2;
                let waterNoiseValue = (noise.perlin2(x * waterFrequency, y * waterFrequency) + 1) / 2;

                let tileKey = this.getTileFromNoise(terrainNoiseValue, waterNoiseValue, tiles);

                this.add.image(xPosition, yPosition, 'tiny_town_tiles', tileKey);

                row.push({ x: xPosition, y: yPosition, tileKey });

                // If the tile is water, store its position
                if (tileKey === tiles["water"]) {
                    this.waterTiles.push({ x: xPosition, y: yPosition });
                }

                xPosition += tileSize;
            }
            terrainData.push(row);
            yPosition += tileSize;
        }

        return terrainData;
    }

    generateDecor(terrainData, decor) {
        const decorFrequency = 0.1;
        const cactusThreshold = 0.7;
        const treeThreshold = 0.7;
        const rockThreshold = 0.7;
    
        terrainData.forEach((row) => {
            row.forEach((cell) => {
                let decorNoiseValue = (noise.perlin2(cell.x * decorFrequency, cell.y * decorFrequency) + 1) / 2;
    
                // Place decor based on the tile type
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

    // Determine which tile type to place based on noise value
    getTileFromNoise(terrainNoiseValue, waterNoiseValue, tiles) {
        if (waterNoiseValue < 0.3) {
            return tiles["water"];
        }

        if (terrainNoiseValue < 0.5) {
            return tiles["MiddleMiddleGrass"];
        } else {
            return tiles["MiddleMiddleSand"];
        }
    }

    // Check if a tile is water
    isWaterTile(x, y) {
        return this.waterTiles.some(tile => {
            // Snap player position to tile grid to avoid floating-point precision issues
            const snappedX = Math.floor(x / 45) * 45;
            const snappedY = Math.floor(y / 45) * 45;
            return tile.x === snappedX && tile.y === snappedY;
        });
    }

    update() {
        const speed = 5;  // Player movement speed

        if (this.player) {
            let newX = this.player.x;
            let newY = this.player.y;

            if (this.cursors.left.isDown) {
                newX -= speed;
            }
            if (this.cursors.right.isDown) {
                newX += speed;
            }
            if (this.cursors.up.isDown) {
                newY -= speed;
            }
            if (this.cursors.down.isDown) {
                newY += speed;
            }

            // Prevent movement if the new position is a water tile
            if (!this.isWaterTile(newX, newY)) {
                this.player.x = newX;
                this.player.y = newY;
            }
        }
    }
}

// Export the scene
export default TinyTown;
