import '../../lib/perlin.js';  // Import Perlin.js from the correct path

class TinyTown extends Phaser.Scene {
    constructor() {
        super("tinyTown");
    }

    preload() {
        // Load the tilesheet and XML data
        this.load.setPath("./assets/");
        this.load.atlasXML('tiny_town_tiles', 'mapPack_spritesheet.png', 'mapPack_spritesheet.xml');
    }

    create() {
        // Define map dimensions (in tiles)
        const height = 15;  // 15 rows
        const width = 20;   // 20 columns

        // Define the tileset to use for the terrain
        const tiles = {
            "UpperLeftSand": "mapTile_001.png", 
            "UpperMiddleSand": "mapTile_002.png", 
            "UpperRightSand": "mapTile_003.png", 
            "MiddleLeftSand": "mapTile_016.png", 
            "MiddleMiddleSand": "mapTile_017.png", 
            "MiddleRightSand": "mapTile_018.png", 
            "LowerLeftSand": "mapTile_031.png",
            "LowerMiddleSand": "mapTile_032.png",
            "LowerRightSand": "mapTile_033.png",
            "UpperLeftGrass": "mapTile_006.png", 
            "UpperMiddleGrass": "mapTile_007.png", 
            "UpperRightGrass": "mapTile_008.png", 
            "MiddleLeftGrass": "mapTile_021.png",
            "MiddleMiddleGrass": "mapTile_022.png",
            "MiddleRightGrass": "mapTile_023.png",
            "LowerLeftGrass": "mapTile_036.png",
            "LowerMiddleGrass": "mapTile_037.png",
            "LowerRightGrass": "mapTile_038.png",
            "water": "mapTile_188.png",
        };

        const decor = {
            "cactus": "mapTile_035.png",
            "rock": "mapTile_050.png",
            "tree": "mapTile_040.png",
            "sandRock": "mapTile_049.png",
            "grassDecor": "mapTile_054.png",
            "castle": "mapTile_099.png",
            "mushroom": "mapTile_104.png",
        };

        // Generate the initial map
        this.generateMap(width, height, tiles, decor);

        // Regenerate the map when the 'R' key is pressed
        this.input.keyboard.on('keydown-R', () => {
            noise.seed(Math.random());  // Generate new seed
            this.generateMap(width, height, tiles, decor);  // Regenerate map
        });

        document.getElementById('description').innerHTML = 
            '<h2>Press &lt; to shrink the sample window</h2>' + 
            '<h2>Press R to regenerate map</h2>' + 
            '<h2>Press &gt; to grow the sample window</h2>';
    }

    // Function to generate the terrain and decor
    generateMap(width, height, tiles, decor) {
        const tileSize = 64;   // Each tile is 64x64 pixels
        const frequency = 0.12; // Increased frequency for smaller islands
        let yPosition = 0;     // Starting y position

        this.children.removeAll();  // Clear all existing tiles before regenerating

        // Store the terrain data to place decor later
        const terrain = [];

        // Generate terrain (tiles) first
        for (let y = 0; y < height; y++) {
            let xPosition = 0;  // Starting x position
            const row = [];
            for (let x = 0; x < width; x++) {
                // Get Perlin noise value between -1 and 1, normalize to 0-1 range
                let noiseValue = (noise.perlin2(x * frequency, y * frequency) + 1) / 2;

                // Determine tile type based on the noise value
                let tileKey = this.getTileFromNoise(noiseValue, tiles);

                // Place the tile at the calculated x, y position
                this.add.image(xPosition, yPosition, 'tiny_town_tiles', tileKey);

                // Store the tile for later decor placement
                row.push({ tileKey, x: xPosition, y: yPosition });

                // Move to the next tile horizontally
                xPosition += tileSize;
            }
            terrain.push(row);
            // Move to the next row vertically
            yPosition += tileSize;
        }

        // Now generate decor on top of the terrain
        this.generateDecor(terrain, decor);
    }

    // Generate decor on top of valid terrain
    generateDecor(terrain, decor) {
        const decorFrequency = 0.2; // Lower frequency for placing decor
        terrain.forEach((row, y) => {
            row.forEach((cell, x) => {
                // Only place decor on certain tiles (e.g., no decor on water)
                if (cell.tileKey !== "water") {
                    let noiseValue = (noise.perlin2(x * decorFrequency, y * decorFrequency) + 1) / 2;

                    // Randomly select a decor element based on noise value
                    if (noiseValue > 0.75) {
                        // Select random decor element
                        let decorKey = this.getRandomDecor(decor);
                        this.add.image(cell.x, cell.y, 'tiny_town_tiles', decorKey);
                    }
                }
            });
        });
    }

    // Get a random decor item
    getRandomDecor(decor) {
        const keys = Object.keys(decor);
        const randomIndex = Math.floor(Math.random() * keys.length);
        return decor[keys[randomIndex]];
    }

    // Determine which tile type to place based on noise value
    getTileFromNoise(noiseValue, tiles) {
        // Water-heavy with even distribution for sand and grass
        if (noiseValue < 0.6) {
            return tiles["water"];  // Water covers the majority of the map
        } else if (noiseValue < 0.7) {
            return tiles["UpperLeftSand"];  // Sand tile for the shore (evenly distributed with grass)
        } else if (noiseValue < 0.8) {
            return tiles["UpperLeftGrass"];  // Grass tile for the inner part of islands
        } else {
            return tiles["MiddleMiddleGrass"];  // Grass tile for inner part of island
        }
    }

    update() {
        // You can add interactive logic or animations here
    }
}

// Export the scene
export default TinyTown;
