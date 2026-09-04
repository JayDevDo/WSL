// WSL_CONSTANTS.js

let changDFviewArr = [ "sum", "count", "avg", "fpl" ];

let changDFviewIdx = 0;

let myFPLTeamIds = [];

let fixtureArray = [];

let allStatsData = [];

let cupDataAll = {};
/* {
	'evtp-FAC': [],
	'evtp-EFL': [],
	'evtp-EHL': [],
	'evtp-EUL': [],
	'evtp-EOL': [],
	'evtp-UIB': []	
};
*/
let linearScale = ( value )=>{
	let minValue = 1 ;
	let maxValue = 100 ;

	let startRGB = [ 255, 204, 255 ] ;
	let endRGB = [ 204, 0, 204 ] ;

	let clampedValue = Math.max( minValue, Math.min( maxValue, Number(value) ) ) ;
	let ratio = ( clampedValue - minValue ) / ( maxValue - minValue ) ;

	let red = Math.round( startRGB[0] + (( endRGB[0] - startRGB[0] ) * ratio) ) ;
	let green = Math.round( startRGB[1] + (( endRGB[1] - startRGB[1] ) * ratio) ) ;
	let blue = Math.round( startRGB[2] + (( endRGB[2] - startRGB[2] ) * ratio) ) ;
	if (value === 300){
		console.log("linearScale 300: value: ", value, "--r: ", red, "--g: ", green, "--b: ", blue ) ;
	}else{
		console.log("linearScale otther: value: ", value, "--r: ", red, "--g: ", green, "--b: ", blue ) ;		
	}
	return "rgb(" + red + ", " + green + ", " + blue + ")" ;
}
/*
[yellow-purple]
Dark: #861D46
Light: #FFFF33

[purple]
Dark: 	#CC00CC
Light: 	#FFCCFF
*/

let callIndexer = 0 ;
getCI = ()=>{ callIndexer++; return callIndexer.toString() ; }

let gamesOverview = {
		fixedColumns: 3,
		finishedRounds: 0,
		currentRnd: 1,
		evWndw: { 'direction': 1 , 'start': 1, 'rounds': 8, 'end': 8 },
		locks: [ false, false, false ],
		locked: false,
		dfDisplay: {
			containerViz: 	false,
			strengthsViz: 	false,
			strengthsVizA: 	false,
			strengthsVizH: 	false
		},
		dfSource: {
			user: false,
			loaded:[ false, false ] 	/* 	DF data available (from WSL constants WSLTeamsFull /fixtures/teams or user) */
		},
		showSttng: true,
		showDdln: true,
		hasPP: false,
		showPP: false,
		showRP: false,
		postponedGameIds: [],
		postponedGames: [],
		replannedGamesIds: [],
		replannedGames: [],
		iBreaks: [],
		iBreaksShow: false,
		evTypes: [ "evtp-WSL", "evtp-UIB" ], 
		/*  
			"evtp-FAC",
			"evtp-EHL", 
			"evtp-EUL", 
			"evtp-EOL", 
			"evtp-EFL",
			"evtp-UIB"
		*/
		selectedTeamId: 9,
		teamFilter: [ true , true , true , true , true , true , true , true , true , true , true , true , true , true , true ],
		sort: 1 ,
		fontSize: 10
}

getEventWndwStart 	= ()=>{ return parseInt( gamesOverview.evWndw['start'] ) ; 	}
getRndsToShow 		= ()=>{ return parseInt( gamesOverview.evWndw['rounds'] ) ;	}
getEventWndwEnd  	= ()=>{ return parseInt( gamesOverview.evWndw['end'] ) ; 	}

getFxtrData = (fxtrId)=>{
	let retObj = { 'msg': "fxtrId not found !" } ;
	for( let fixture of fixtureArray ){
		if( fixture.id == fxtrId ){
			retObj = fixture ;
			break ;
		}
	}
	return retObj ;
}


hasUserStore = ()=>{
	if( !localStorage.userdfwsl ){ return false ; }
	return JSON.parse( localStorage.userdfwsl ).length == 14 ;
}

setUserDF = ()=>{
	// Stores the current values in the DF container to localstorage and WSLTeamsFull
	// Then updates view by calling 'loadUserDF()'
	if( localStorage.userdfwsl ){ delUserDF() }
	let lclStrgArr = [] ;
	let h_df = $("#df_home > td[df]").get() ;
	let a_df = $("#df_away > td[df]").get() ;
	if( h_df.length == a_df.length ){
		$.each(
			h_df,
			(i,t)=>{
				WSLTeamsFull[
					parseInt( $( t ).attr( 'tmId' ) )].usrDF = [
						parseInt($( h_df[i] ).attr( 'df' )),
						parseInt($( a_df[i] ).attr( 'df' ))
					] ;
				lclStrgArr.push(
					{
						'tmid': parseInt( $( t ).attr( 'tmId' ) ),
						'h': parseInt( $( h_df[i] ).attr( 'df' ) ),
						'a': parseInt( $( a_df[i] ).attr( 'df' ) )
					}
				) ;
		}) ;

		gamesOverview.dfSource.user = true ;
		gamesOverview.dfSource.loaded[1] = true ;
		setIndicator( "usr-df-Ldd-idc", "green") ;
	}else{
		console.log("something went wrong !") ;
	}

	localStorage.userdfwsl = JSON.stringify( lclStrgArr ) ;
	// Apply the new values to the view
	loadUserDF() ;
}

delUserDF = ()=>{
	// console.log("delUserDF") ;
	localStorage.userdfwsl = JSON.stringify( [] );
}

loadUserDF = ()=>{
	// Load values from localStorage into WSLTeamsFull, DF container and fixtures
	let storedH = [] ;
	if( localStorage.userdfwsl ){
		storedH = JSON.parse( localStorage.userdfwsl ) ;
	}else{
		console.log("loadUserDF: localStorage doesnt exist.") ;
	}

	if( storedH.length != 14 ){
		storedH = [] ;
		for( let t = 1; t < WSLTeamsFull.length; t++ ){
			storedH.push(
				{
					'tmid': WSLTeamsFull[t].id,
					'h': WSLTeamsFull[t].usrDF[0],
					'a': WSLTeamsFull[t].usrDF[1]
				}
			) ;
		}
	}

	for( let t = 0; t < storedH.length; t++ ){
		let tmId = parseInt( storedH[t]['tmid'] ) ;
		let teamHval = parseInt( storedH[t]['h'] ) ;
		let teamAval = parseInt( storedH[t]['a'] ) ;
		WSLTeamsFull[tmId]['usrDF'] = [ teamHval, teamAval ] ;
		$("#df_home td[tmid="+ tmId + "]").attr( "df", teamHval ) ;
		$("#df_home td[tmid="+ tmId + "]").text( teamHval.toString() ) ;
		let hteamOpps = $(".fxtrspan[teamid_h="+ tmId + "][loc='A']").get() ;
		$.each(
			hteamOpps,
			(index, oppFxtr)=>{
				let hText = [
					WSLTeamsFull[tmId].shortNm,
					" A (",
					teamHval.toString(),
					")"
				].join("") ;

				$( oppFxtr ).addClass( "customDF" ) ;
				$( oppFxtr ).text( hText ) ;
				$( oppFxtr ).attr( "df", teamHval ) ;
		}) ;

		$("#df_away td[tmid="+ tmId + "]").attr( "df", teamAval ) ;
		$("#df_away td[tmid="+ tmId + "]").text( teamAval.toString() ) ;
		let ateamOpps = $(".fxtrspan[teamid_a="+ tmId + "][loc='H']").get() ;
		$.each(
			ateamOpps,
			(index, oppFxtr)=>{
				let aText = [
					WSLTeamsFull[tmId].shortNm,
					" H (",
					teamAval.toString(),
					")"
				].join("") ;
				$( oppFxtr ).addClass( "customDF" ) ;
				$( oppFxtr ).text( aText ) ;
				$( oppFxtr ).attr( "df", teamAval ) ;
		}) ;
	}

	gamesOverview.dfSource.user = true ;
	setIndicator( "usr-df-Ldd-idc", "green" ) ;
	setIndicator( "wsl-df-Ldd-idc", "red" ) ;
	updateTotalDF( changDFviewIdx ) ;
}

loadWSLDF = (gw=gamesOverview.currentRnd)=>{
	/*
		Load values from the CONSTANTS WSLTeamsFull[x]['fplDF'][ h, a ] situated below into the DFcontainer and fixtures.
		These are/were the values set by the developer of this at the start of the season.
		To load the most recent values, run update_FPLDF(Gameweek).

	*/
	console.log("loadWSLDF| gw:",gw )
	if( WSLTeamsFull.length == 15 ){
		for( let t = 1; t < WSLTeamsFull.length; t++){
			// Update DF container attribs + text
			// Update fixture DF's
			// Update WSLTeamsFull[x]['usrDF'] = [homevalue, awayvalue ]
			let teamHval = parseInt( WSLTeamsFull[t]['fplDF'][0] ) ;
			let teamAval = parseInt( WSLTeamsFull[t]['fplDF'][1] ) ;
			$("#df_home td[tmid="+ (t) + "]").attr( "df", teamHval) ;
			$("#df_home td[tmid="+ (t) + "]").text( teamHval.toString() ) ;
			let hteamOpps = $(".fxtrspan[teamid_h="+ t + "][loc='A']").get() ;
			$.each(
				hteamOpps,
				(index, oppFxtr)=>{
					let hText = [ WSLTeamsFull[t].shortNm, " A (", teamHval.toString(), ")" ].join("") ;
					$(oppFxtr).removeClass("customDF") ;
					$(oppFxtr).text( hText ) ;
					$(oppFxtr).attr( "df", teamHval) ;
			}) ;

			$("#df_away td[tmid="+ t + "]").attr( "df", teamAval ) ;
			$("#df_away td[tmid="+ t + "]").text( teamAval.toString() ) ;
			let ateamOpps = $(".fxtrspan[teamid_a="+ t + "][loc='H']").get() ;
			// console.log("ateamOpps=", ateamOpps.length ) ;
			$.each(
				ateamOpps,
				(index, oppFxtr)=>{
					let aText = [ WSLTeamsFull[t].shortNm, " H (", teamAval.toString(), ")" ].join("") ;
					$(oppFxtr).removeClass("customDF") ;
					$(oppFxtr).text( aText ) ;
					$(oppFxtr).attr( "df", teamAval) ;
			}) ;

		}
		gamesOverview.dfSource['user'] = false ;
		setIndicator("usr-df-Ldd-idc", "red" ) ;
		setIndicator("wsl-df-Ldd-idc", "green" ) ;
	}
}

clearIndicator = (indctr)=>{
	$.each(
		[ "greenLight", "orangeLight", "redLight", "yellowLight" ],
		function(i,c){ $( "#"+ indctr ).removeClass(c); }
	);
}

setIndicator = (indctr,color)=>{
	clearIndicator(indctr);
	$( "#"+ indctr ).addClass( color+"Light" ) ;
}

resetIndics = ()=>{
	$.each(
		[
			"fxtrsLdd-idc", 	// 	Indicator for getFixtureData()
			"ppsLdd-idc", 		// 	Indicator for getPostponedData() / buidPPContainer()
			"wsl-df-Ldd-idc", 	// 	wsl-df-Ldd-idc 	Indicator for allPromise --> TEAM LOOP
			"usr-df-Ldd-idc", 	// 	usr-df-Ldd-idc 	Indicator for loadUserDF()
			"wsl-ha-Ldd-idc", 	// 	wsl-ha-Ldd-idc 	Indicator for allPromise --> TEAM LOOP
			"df-Ldd-idc" 		// 	df-Ldd-idc 		Indicator for allPromise --> FXTRS LOOP
		],
		function(idc){
			setIndicator(idc, "orange") ;
		}
	);
}

tmFilterReset = ()=>{
	gamesOverview.teamFilter = Array(15).fill(true)	;
	$( "#slctdTeams" ).val( "a" ) ;
	let tmIndics = $("#eventTable > tr > th > div.tm-idc").get() ;

	$.each(
		tmIndics ,
		( index, indic )=>{
			console.log("tmFilterReset i:", index, "indic: ", indic ) ;
			$( indic ).addClass( "yellowLight" ) ;
		}

	) ;
}

exportGmsOvrvw = ()=>{
	return gamesOverview ;
}

exportFTbl = ()=>{
	return WSLTeamsFull;
}

openPPInfo = ( fxtrId )=>{
	let ppArray = gamesOverview.postponedGames ;

	for( let p = 0; p < ppArray.length; p++ ){

		if( parseInt( ppArray[p].ppid ) == parseInt( fxtrId ) ){
			console.log(
				"opening postponement info for fxtrId",
				fxtrId,
				"link:",
				ppArray[p].link
			) ;

			window.open( ppArray[p].link, "_blank" ) ;
			break ;
		}
	}
}

let WSLTeamsFull = [
	{   shortNm: "NWS",
		id: 0,
		fplDF: [ 1, 1 ] , 	/* [HOME,AWAY] */
		usrDF: [ 1, 1 ] , 	/* [HOME,AWAY] */
		ownDFhis: [] ,		/* from fixtures */
		oppDFhis: [] , 		/* from fixtures */
		longNm: "Not-a-WSL-team",
		altNm: "placeholder",
		players: [],
		strength: [
			{ 'loc':"H", 'overall': 0, 'attack': 0, 'defence': 0 },
			{ 'loc':"A", 'overall': 0, 'attack': 0, 'defence': 0 }
		],
		ppgames: []
	},
	{   shortNm: "ARS",
		id: 1,
		fplDF: [ 5, 5 ] , 	/* [HOME,AWAY] */
		usrDF: [ 5, 5 ] ,
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Arsenal",
		altNm: "Gunners",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 1950, 'attack': 2100, 'defence': 1800 },
			{ 'loc': "A", 'overall': 1950, 'attack': 2100, 'defence': 1800 }
		],
		ppgames: []
	},
	{
		shortNm: "AVL",
		id: 2,
		fplDF: [ 3, 3 ],
		usrDF: [ 3, 2 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Aston Villa",
		altNm: "Villans",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "BIR",
		id: 3,
		fplDF: [ 2, 2 ],
		usrDF: [ 2, 1 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Birmingham City",
		altNm: "Brummies",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "BHA",
		id: 4,
		fplDF: [ 3, 3 ],
		usrDF: [ 3, 2 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Brighton",
		altNm: "Seagulls",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "CHA",
		id: 5,
		fplDF: [ 2, 2 ],
		usrDF: [ 2, 1 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Charlton Athletic",
		altNm: "Addicks",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "CHE",
		id: 6,
		fplDF: [ 4, 4 ],
		usrDF: [ 5, 4 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Chelsea",
		altNm: "Blues",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "CRY",
		id: 7,
		fplDF: [ 2, 2 ],
		usrDF: [ 2, 1 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Crystal Palace",
		altNm: "Eagles",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "EVE",
		id: 8,
		fplDF: [ 3, 2 ],
		usrDF: [ 2, 2 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Everton",
		altNm: "Toffees",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "LIV",
		id: 9,
		fplDF: [ 4, 3 ],
		usrDF: [ 3, 2 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Liverpool",
		altNm: "Reds",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "LCL",
		id: 10,
		fplDF: [ 3, 3 ],
		usrDF: [ 4, 3 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "London City Lionesses",
		altNm: "Lionesses",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "MNC",
		id: 11,
		fplDF: [ 5, 5 ],
		usrDF: [ 5, 4 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Manchester City",
		altNm: "Citizens",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "MNU",
		id: 12,
		fplDF: [ 4, 4 ],
		usrDF: [ 4, 3 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Manchester United",
		altNm: "Red Devils",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "TOT",
		id: 13,
		fplDF: [ 3, 3 ],
		usrDF: [ 3, 3 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "Tottenham Hotspur",
		altNm: "Spurs",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	},
	{
		shortNm: "WHU",
		id: 14,
		fplDF: [ 2, 2 ],
		usrDF: [ 2, 2 ],
		ownDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		oppDFhis: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ],
		longNm: "West Ham United",
		altNm: "Hammers",
		players: [],
		strength: [
			{ 'loc': "H", 'overall': 300, 'attack': 300, 'defence': 300 },
			{ 'loc': "A", 'overall': 300, 'attack': 300, 'defence': 300 }
		],
		ppgames: []
	}
];

console.log(
	"\n--- WSL constants ---\n",
	"changDFviewArr", changDFviewArr.length,
	"myFPLTeamIds", myFPLTeamIds.length,
	"WSLTeamsFull", WSLTeamsFull.length,
	"\n--- WSL constants END ---\n"
);