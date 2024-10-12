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
            // Sand Decor
            "cactus": "mapTile_035.png",

            // Grass Decor
            "tree": "mapTile_040.png",

            // Water Decor
            "sandRock": "mapTile_049.png",
        };

        // Store the initial noise frequency for map generation
        this.terrainFrequency = 0.06;  // Lower frequency for larger, more distinct regions
        this.waterFrequency = 0.15;    // Slightly higher frequency for sporadic water placement

        // Generate the initial map
        const terrainData = this.generateTerrain(width, height, tiles);

        // Generate decor based on terrain
        this.generateDecor(terrainData, decor);

        // Regenerate the map with 'R' key
        this.input.keyboard.on('keydown-R', () => {
            noise.seed(Math.random());  // Generate new seed
            const newTerrainData = this.generateTerrain(width, height, tiles);  // Regenerate terrain
            this.generateDecor(newTerrainData, decor);  // Regenerate decor
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
        // Adjust both terrain and water frequencies
        this.terrainFrequency += amount;    
        this.waterFrequency += amount;    
    
        // Prevent frequencies from getting too small or too large
        this.terrainFrequency = Math.max(0.02, Math.min(0.5, this.terrainFrequency));  
        this.waterFrequency = Math.max(0.02, Math.min(0.5, this.waterFrequency));  
    
        // Regenerate the terrain and decor with the updated frequency
        const terrainData = this.generateTerrain(width, height, tiles);
    
        // Recalculate the decor after adjusting the frequencies
        this.generateDecor(terrainData, decor);  
    }

    // Generate terrain and water
    generateTerrain(width, height, tiles) {  // No need for decor here
        const tileSize = 45;   // Each tile is 45x45 pixels
        const terrainFrequency = this.terrainFrequency; // Use the terrain frequency for grass and sand regions
        const waterFrequency = this.waterFrequency;     // Use a different frequency for water to scatter it
        let yPosition = 0;     // Starting y position

        this.children.removeAll();  // Clear tiles before regenerating

        // Store terrain data for decor placement
        const terrainData = [];

        // Generate terrain and water
        for (let y = 0; y < height; y++) {
            let xPosition = 0;  // Starting x position
            const row = [];
            for (let x = 0; x < width; x++) {
                // Get Perlin noise value for terrain between -1 and 1, normalize to 0-1 range
                let terrainNoiseValue = (noise.perlin2(x * terrainFrequency, y * terrainFrequency) + 1) / 2;

                // Get Perlin noise value for water with a higher frequency for scattering
                let waterNoiseValue = (noise.perlin2(x * waterFrequency, y * waterFrequency) + 1) / 2;

                // Determine tile type based on noise values
                let tileKey = this.getTileFromNoise(terrainNoiseValue, waterNoiseValue, tiles);

                // Place the tile at the calculated x, y position
                this.add.image(xPosition, yPosition, 'tiny_town_tiles', tileKey);

                // Store the tile data for decor generation
                row.push({ x: xPosition, y: yPosition, tileKey });

                // Move to the next tile horizontally
                xPosition += tileSize;
            }
            terrainData.push(row);
            // Move to the next row vertically
            yPosition += tileSize;
        }

        return terrainData;  // Return terrain data for use in decor generation
    }

    generateDecor(terrainData, decor) {
        const decorFrequency = 0.1;  // Frequency for decor placement
        const cactusThreshold = 0.7;  // Threshold for cactus placement
        const treeThreshold = 0.7;    // Threshold for tree placement
        const rockThreshold = 0.7;    // Threshold for rock placement on water
    
        terrainData.forEach((row) => {
            row.forEach((cell) => {
                let decorNoiseValue = (noise.perlin2(cell.x * decorFrequency, cell.y * decorFrequency) + 1) / 2;
    
                // Place decor based on the tile type
                if (cell.tileKey === "mapTile_017.png") {  
                    // Sand tiles: Place cactus with equal frequency
                    if (decorNoiseValue > cactusThreshold) {
                        console.log(`Placing cactus at (${cell.x}, ${cell.y})`);
                        this.add.image(cell.x, cell.y, 'tiny_town_tiles', decor["cactus"]);
                    }
                } else if (cell.tileKey === "mapTile_022.png") {
                    // Grass tiles: Place trees with equal frequency
                    if (decorNoiseValue > treeThreshold) {
                        console.log(`Placing tree at (${cell.x}, ${cell.y})`);
                        this.add.image(cell.x, cell.y, 'tiny_town_tiles', decor["tree"]);
                    }
                } else if (cell.tileKey === "mapTile_188.png") {
                    // Water tiles: Place rocks, but no cactus or tree
                    if (decorNoiseValue > rockThreshold) {
                        console.log(`Placing sand rock at (${cell.x}, ${cell.y})`);
                        this.add.image(cell.x, cell.y, 'tiny_town_tiles', decor["sandRock"]);
                    }
                
                }
            });
        });
    }

    // Determine which tile type to place based on noise value
    getTileFromNoise(terrainNoiseValue, waterNoiseValue, tiles) {
        // Use the water noise value to scatter water sporadically across the map
        if (waterNoiseValue < 0.3) {  // 30% chance for sporadic water placement
            return tiles["water"];
        }

        // Use terrain noise value for larger clusters of grass and sand
        if (terrainNoiseValue < 0.5) {
            return tiles["MiddleMiddleGrass"];  // 30% chance for grass
        } else {
            return tiles["MiddleMiddleSand"];   // 30% chance for sand
        }
    }

    update() {
        // You can add interactive logic or animations here
    }
}

// Export the scene
export default TinyTown;
