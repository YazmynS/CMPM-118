Goal
The goal of this assignment is to use a noise function (such as Perlin noise) to randomly generate a tile-based map.

Approach
The tile-based map should be at least 15 tiles tall and 20 tiles wide in size. 

While the details of the generated maps will vary, in general, there should be both water and at least two different types of land terrain in the generated maps.

When the program begins, it should display a fresh generated tile-based map.

Your generator needs to support the following commands:

Pressing the R key regenerates the map using a new seed value, thereby ensuring the map looks different.
Pressing the , or < key causes the noise sample window to shrink, and the . or > key causes the sample window to grow. Pressing the key leads to a new map display, but not a new noise seed value.
This is an individual assignment. You are free to discuss the assignment with other people in the class, but everyone needs to submit their own code generator.

Technology
Unless you discuss alternatives with the instructor, I expect you to use JavaScript and the Phaser game framework.

There are many JavaScript noise libraries, and this noise library by Seph GentleLinks to an external site. is recommended and should work well with Phaser. 

The Kenny Map PackLinks to an external site. provides a good set of terrain tiles.

The Mappy code examplLinks to an external site.e created by Nathan Altice gives an example of procedural tile map generation (see file Random,js).

Evaluation
Base capability

The base level assignment is to procedurally generate tile maps using noise, and to support the 'R' key regeneration functionality. Only the interior tiles need be used, no need to use tiles while transition between different terrain types.

Advanced capabilities

More advanced capabilities you can include in your generator are:

Use the transition tiles to make the resulting terrain more visually appealing.
Placement of some of the decoration tiles onto the map, ensuring placements are terrain appropriate (e.g., no cactus on the ice tiles).
Use the road tiles to create roads between different locations on the map. Better yet, create an entire overworld map using the green and while square tiles (see the example map in the Kenny Map Pack for the general idea).
Add a player avatar which can move across the map. Have messages appear at different locations in the map.
Procedurally generate place names (perhaps using TraceryLinks to an external site.) and place them on the map in appropriate locations.
