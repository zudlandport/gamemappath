/*
===
Introduction
===
dungeontreasurepath.js is a small part of the offline processes which create database data for procedurally-generated maze-like maps for this game: https://dungeon.wyvernquest.com

Purpose:
This specific function is designed to backfill the shortest path from a treasure (called "lucre" in the code/variable shorthand) to the map's start point.  For data compression reasons, it returns that path as Moves (up, down, left or right), which are coded as 2-bit Binaries (00 = left, 01 = up, 10 = right, 11 = down).  This gives us a database footprint of a varbinary that will be at most (largest walking distance on the map)*2 bits.

Inputs:
It takes in the Start Position of the map, an array of treasures (whose Values are "_"-delimited lists, the first 2 items of which are the treasure's X-coordinate and Y-coordinate), and asqseen (array of squares seen) which is an associative array whose Keys are X+"_"+Y coordinates, and whose Values are the number of steps it takes to get to those coordinates from the map start point (not as-the-crow-flies, but the actual shortest number of steps needed to get through the maze from Start Position to that square).  asqseen was populated by a recursive function during initial map generation, and we assume it to be accurate and well-formed; the function has checks and balances for malformed data:  it won't return useful answers, its failure would show up in its internal debugging message, and it won't run indefinitely.

Why this function exists:
asqseen is no longer needed once the map generation is complete, so it is not part of moving the map into the game's database.  However we DO want to be able to display the optimal walking path between the start point and each treasure in the future.

How it works in general:
For each treasure, it looks up its starting X,Y position in asqseen and sees the asqseen Distance of that square. Then it looks left, up, down and right from its X,Y position, to find which of those adjacent squares exists in asqseen* and is also one step less distant from the start position. If it finds such a square, it records that as the next step to take back towards the start position**. It then repeats that process for each new square until it reaches the start position (or dead-ends / takes more steps than should exist, because asqseen is in some way broken or malformed).

*: if an X,Y coordinate does not exist in asqseen, there's a wall there, and not a passable square.

**: because the answer we want is "how do I walk from the start to this treasure?", it records each decision "backwards": for example if this treasure's distance from the starting point is listed as 95 steps, and our first step from the treasure towards the start is to step Right, we report the 95th Step is Left, because that is what will take us from the 94th Step to the square we want to be on for the 95th Step.

*/



/*		===	===	===	*/
/*		===	===	===	*/
/*  original code and comments follows:  */
/*		===	===	===	*/
/*		===	===	===	*/




/* 
this function returns an array,
	-whose KEYS are lucre x_y-s
	-and whose VALUES are the path from the STARTPOINT to the lucre, in terms of U,D,L,R steps
incoming:
	alucres = array(x_y_etcetc, x2_y2_etcetc,)
	asqseen['x_y'] = dist
*/
function lucres_getbinpathfromdoor(astartxy, alucres, asqseen) {
 var alucrebinpaths = new Array();
 var alucredirpaths = new Array();
 var atpaths = new Array();
 /* [[ CODE SAMPLE NOTE ]]  in the original code, this array was returned from a function */
 var aalldirs = new Array( new Array(-1,0),new Array(0,-1),new Array(1,0),new Array(0,1) );

 var show_stepwalk = false;

 var msg = 'DOING SHOW LUCRE PATHS:';
 for (var i=0; i<alucres.length; i++) { // alucres.length;
	var al = alucres[i].split('_');
	var acur = new Array(parseInt(al[0]),parseInt(al[1]));
	var firstdist = asqseen[acur[0]+'_'+acur[1]];
	var curdist = firstdist;
	var tries = 0;
	var prob = false;
	msg += '<br><em>Lucre ' + acur.join('_') + ':</em> from ' +firstdist; //+ '<ol>';
	var amove = new Array();
	while (curdist > 0 && tries - 10 < firstdist) {
		var thismsg = '<br/>' + acur.join('_') +', dist=' + curdist +': ';
		// here's a way to populate squares ANYTHING needs flagged, but that's not useful to test the output we want to test:
		// atpaths[ atpaths.length ] = acur.join('_');
		tries++;
		var thisdist = curdist;
		// there will be ONE square stepable from acur whose asqseen is (curdist-1)
		for (var j = 0; j<aalldirs.length; j++) {
			var anew = new Array(
				acur[0] + aalldirs[j][0],
				acur[1] + aalldirs[j][1]
			);
			var newxy = anew.join('_');
			if (asqseen[newxy]!=undefined && asqseen[newxy] == curdist - 1) {
				acur = new Array(anew[0],anew[1]);
				curdist--;
				// now, to record the move that gets us to this square (the OPPOSITE of the move we did)
				amove[curdist] = (j + 2) % aalldirs.length;
				break;
			}
		}
		if (thisdist == curdist) {
			prob = true;
			thismsg += '<em>DEAD ENDED at ' + acur.join('_') + '</em>';
			msg += thismsg;
			break;
		}
	} // end while-loop for 1 lucre
	if (!prob) {
		msg += ' Success, ' + amove.length +' steps:<br/>';
		msg += amove.join(', ');
		alucredirpaths[alucres[i]] = amove;
	}
 } // end lucre-loop

 // this would confirm we can re-build it from the "directions":
 /* [[ CODE SAMPLE NOTE ]] Commented out for this stand-alone code sample function
 display_alucredirpaths(astartxy,alucredirpaths,show_stepwalk);
 */
 
 // now we just want to translate 0,1,2,3 move-directions into binary paths:
 for (var xy in alucredirpaths) {
	var bp = '';
	for (var i=0; i<alucredirpaths[xy].length; i++) {
		// add encoded to string:
		bp += lucredir_encodetobin(alucredirpaths[xy][i]);
	}
	alucrebinpaths[xy] = bp;
 }

 /* [[ CODE SAMPLE NOTE ]] Commented out for this stand-alone code sample function
 debugmsg(msg);
 */
 return alucrebinpaths;
}


function lucredir_encodetobin(dir) {
 var adxb = new Array('00','01','10','11');
 return adxb[dir];
}
