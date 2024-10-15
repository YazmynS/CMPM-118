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
        const height = 15;  // 15 row
        const width = 20;   // 20 col

        // Define terrain tiles
        const tiles = {
            "water": "mapTile_188.png",           
            "MiddleMiddleGrass": "mapTile_022.png", 
            "MiddleMiddleSand": "mapTile_017.png"  
        };

        //Define decor tiles
        const decor = {
            "cactus": "mapTile_035.png",
            "tree": "mapTile_040.png",
            "sandRock": "mapTile_049.png",
        };

        //Define player sprite
        const player = {
            "sprite": "mapTile_136.png"
        };

        // Initialize Frequencies
        this.terrainFrequency = 0.06;  // Lower frequency = large regions
        this.waterFrequency = 0.15;    //  higher frequency = sporadic water placement

        // Generate map
        this.terrainData = this.generateTerrain(width, height, tiles);

        // Generate decor based on terrain data
        this.generateDecor(this.terrainData, decor);

        // Add the player sprite (Note: Generic Start Position, Could be anywhere.)
        this.player = this.add.image(200, 200, 'tiny_town_tiles', player.sprite);

        // Get arrow keys
        this.cursors = this.input.keyboard.createCursorKeys(); 

        // Regenerate the map, decor, and player
        this.input.keyboard.on('keydown-R', () => {
            noise.seed(Math.random());  // Generate new seed
            const newTerrainData = this.generateTerrain(width, height, tiles);  
            this.generateDecor(newTerrainData, decor); 
            this.player = this.add.image(200, 200, 'tiny_town_tiles', player.sprite);
        });

        // Shrinking and Growing Window Keys
        this.input.keyboard.on('keydown-COMMA', () => {
            this.adjustFrequency(-0.02, width, height, tiles, decor);
        });

        this.input.keyboard.on('keydown-PERIOD', () => {
            this.adjustFrequency(0.02, width, height, tiles, decor);
        });

        // Display Directions
        document.getElementById('description').innerHTML = 
            '<h2>Press &lt; to shrink the sample window</h2>' + 
            '<h2>Press R to regenerate map</h2>' + 
            '<h2>Press &gt; to grow the sample window</h2>' +
            '<h2>Press arrow keys to move</h2>';
    }

    // Adjust frequency without changing seed
    adjustFrequency(amount, width, height, tiles, decor) {  
        this.terrainFrequency += amount;    
        this.waterFrequency += amount;    
    
        this.terrainFrequency = Math.max(0.02, Math.min(0.5, this.terrainFrequency));  
        this.waterFrequency = Math.max(0.02, Math.min(0.5, this.waterFrequency));  
    
        //Regenerate
        const terrainData = this.generateTerrain(width, height, tiles);
        this.generateDecor(terrainData, decor);
        this.player = this.add.image(200, 200, 'tiny_town_tiles', 'mapTile_136.png');
    }

    // Generate from top right to bottom left
    generateTerrain(width, height, tiles) {
        const tileSize = 64;
        const terrainFrequency = this.terrainFrequency;
        const waterFrequency = this.waterFrequency;
        let yPosition = 0;

        //Clear previous tiles
        this.children.removeAll();

        //Store tile placements/types
        this.waterTiles = [];  
        const terrainData = [];

        //Loop through grid
        for (let y = 0; y < height; y++) {
            let xPosition = 0;
            const row = [];
            for (let x = 0; x < width; x++) {
               //Use noise to place water/terrain tiles
                let terrainNoiseValue = (noise.perlin2(x * terrainFrequency, y * terrainFrequency) + 1) / 2;
                let waterNoiseValue = (noise.perlin2(x * waterFrequency, y * waterFrequency) + 1) / 2;

                let tileKey = this.getTileFromNoise(terrainNoiseValue, waterNoiseValue, tiles);

                this.add.image(xPosition, yPosition, 'tiny_town_tiles', tileKey);

                row.push({ x: xPosition, y: yPosition, tileKey });

                // Note where water tiles are
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
        //Initialize decor frequency 
        const decorFrequency = 0.1;
        const cactusThreshold = 0.7;
        const treeThreshold = 0.7;
        const rockThreshold = 0.7;
    
        //Loop through map grid
        terrainData.forEach((row) => {
            row.forEach((cell) => {
                
                //Use noise to determine decor placement
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

    // Check if a tile is water (Snapped??)
    isWaterTile(x, y) {
        return this.waterTiles.some(tile => {
            const snappedX = Math.floor(x / tileSize) * tileSize;
            const snappedY = Math.floor(y / tileSize) * tileSize;
            return tile.x === snappedX && tile.y === snappedY;
        });
    }

    update() {
        
        //Set Player Speed
        const speed = 5; 

        //Update x,y position
        if (this.player) {
            let newX = this.player.x;
            let newY = this.player.y;

            //Move player with arrow keys
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

            // Prevent movement on water tiles
            if (!this.isWaterTile(newX, newY)) {
                this.player.x = newX;
                this.player.y = newY;
            }
        }
    }
}

// Export scene
export default TinyTown;
