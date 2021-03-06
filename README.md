# Game Map Path code sample:
_dungeontreasurepath.js_ is a small part of the offline processes which create database data for procedurally-generated maze-like maps for this game: https://dungeon.wyvernquest.com
Two of the other files in this repository provide enough framework to demonstrate it; open _dtp_demo.html_ to see its walk paths animated for 8 sample maps (whose data is set in _dtp_testdata.js_).

![21_0514a Dungeon Path Demo img](https://user-images.githubusercontent.com/54818691/118282171-fe0b0e00-b49b-11eb-9754-06afa8fffbd5.png)

## Purpose:
This specific function is designed to backfill the shortest path from a treasure (called "lucre" in the code/variable shorthand) to the map's start point.  For data compression reasons, it returns that path as Moves (up, down, left or right), which are coded as 2-bit Binaries (00 = left, 01 = up, 10 = right, 11 = down).  This gives us a database footprint of a varbinary that will be at most (largest walking distance on the map)*2 bits.

## Inputs:
It takes in the Start Position of the map, an array of treasures (whose Values are "\_"-delimited lists, the first 2 items of which are the treasure's X-coordinate and Y-coordinate), and asqseen (array of squares seen) which is an associative array whose Keys are X+"\_"+Y coordinates, and whose Values are the number of steps it takes to get to those coordinates from the map start point (not as-the-crow-flies, but the actual shortest number of steps needed to get through the maze from Start Position to that square).  asqseen was populated by a recursive function during initial map generation, and we assume it to be accurate and well-formed; the function has checks and balances for malformed data:  it won't return useful answers, its failure would show up in its internal debugging message, and it won't run indefinitely.

## Why this function exists:
asqseen is no longer needed once the map generation is complete, so it is not part of moving the map into the game's database.  However we *do* want to be able to display the optimal walking path between the start point and each treasure in the future.

## How it works in general:
For each treasure, it looks up its starting X,Y position in asqseen and sees the asqseen Distance of that square.  Then it looks left, up, down and right from its X,Y position, to find which of those adjacent squares exists in asqseen\* and is also one step _less_ distant from the start position.  If it finds such a square, it records that as the next step to take back towards the start position\*\*.  It then repeats that process for each new square until it reaches the start position (or dead-ends / takes more steps than should exist, because asqseen is in some way broken or malformed).

\*:  if an X,Y coordinate does not exist in asqseen, there's a wall there, and not a passable square.

\*\*:  because the answer we want is "how do I walk from the start to this treasure?", it records each decision "backwards":  for example if this treasure's distance from the starting point is listed as 95 steps, and our first step from the treasure towards the start is to step Right, we report the 95th Step is Left, because that is what will take us from the 94th Step to the square we want to be on for the 95th Step.

## It's also been rewritten in Python if you prefer
_dungeontreasurepath_in_python.py_ is the same code rewritten in Python, with its own testing infrastructure, if you'd rather read Python than basic JavaScript.  It includes the same 8 demo maps to choose from, but since its output is command line / an ascii version of the map, it's not as cool-looking as the other demo (it doesn't show all walking paths expand at once in animated fashion).

![21_0520a Dungeon Path Demo CLI img](https://user-images.githubusercontent.com/54818691/119039250-05da1f00-b982-11eb-9067-bc1932d4cc28.png)
