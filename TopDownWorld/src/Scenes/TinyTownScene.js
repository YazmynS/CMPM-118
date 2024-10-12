import '../../lib/perlin.js';  // Make sure you include your perlin.js

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
            "water": "mapTile_188.png",   // Water
            "sand": "mapTile_001.png",    // Sand
            "grass": "mapTile_007.png"    // Grass
        };

        // Generate the initial map
        this.generateMap(width, height, tiles);

        // Regenerate the map when the 'R' key is pressed
        this.input.keyboard.on('keydown-R', () => {
            noise.seed(Math.random());  // Generate new seed
            this.generateMap(width, height, tiles);  // Regenerate map
        });

        document.getElementById('description').innerHTML = '<h2>Press R to regenerate map</h2>';
    }

    generateMap(width, height, tiles) {
        const tileSize = 64;   // Each tile is 64x64 pixels
        const frequency = 0.1; // Frequency for the Perlin noise
        let yPosition = 0;     // Starting y position

        this.children.removeAll();  // Clear all existing tiles before regenerating

        // Generate the map by iterating over the height and width
        for (let y = 0; y < height; y++) {
            let xPosition = 0;  // Starting x position
            for (let x = 0; x < width; x++) {
                // Get Perlin noise value between -1 and 1, normalize to 0-1 range
                let noiseValue = (noise.perlin2(x * frequency, y * frequency) + 1) / 2;

                // Determine tile type based on the noise value
                let tileKey = this.getTileFromNoise(noiseValue, tiles);

                // Place the tile at the calculated x, y position
                this.add.image(xPosition, yPosition, 'tiny_town_tiles', tileKey);

                // Move to the next tile horizontally
                xPosition += tileSize;
            }
            // Move to the next row vertically
            yPosition += tileSize;
        }
    }

    getTileFromNoise(noiseValue, tiles) {
        // Map the noise value to specific tiles
        if (noiseValue < 0.3) {
            return tiles["water"];  // Water for low noise values
        } else if (noiseValue < 0.6) {
            return tiles["sand"];   // Sand for medium noise values
        } else {
            return tiles["grass"];  // Grass for high noise values
        }
    }

    update() {
        // You can add interactive logic or animations here
    }
}

// Export the scene
export default TinyTown;
