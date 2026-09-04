// WSL_DATA.js

let curGW = 1;

/*
################################################################################################################
	ASYNCS: 
################################################################################################################
*/

getStaticData = async ()=> {
	let staticPrms = new Promise( ( myStaticResolve )=> {
		let staticXhttp = new XMLHttpRequest();
		staticXhttp.open("GET", "json/WSL_Static_current.json", true ) ; 
		staticXhttp.send() ; 
		staticXhttp.onreadystatechange = ()=>{
			if ( (staticXhttp.readyState == 4) && (staticXhttp.status == 200) ){
				let staticResponse = JSON.parse( staticXhttp.responseText ) ; 
				allStatsData = staticResponse ;
				myStaticResolve( staticResponse ) ; 
			}
		} 
	});
	return await staticPrms ;
};

getPostponedData = async ()=> {
	/*
		gamesOverview.evTypes: [	
			"evtp-WSL", Premier league
			"evtp-FAC",	FA Cup
			"evtp-EFL",	EFL (Carabao) Cup
			"evtp-EUL",	Uefa Europa League
			"evtp-EHL",	Uefa Champions League
			"evtp-UIB"	Uefa International breaks
		]
	*/
	let postpndPrms = new Promise( ( myPPResolve )=> {
		let postpXhttp = new XMLHttpRequest();
		postpXhttp.open("GET", "json/ppFxtrs.json" , true ) ; 
		postpXhttp.send() ; 
		postpXhttp.onreadystatechange = ()=>{
			if ( (postpXhttp.readyState == 4) && (postpXhttp.status == 200) ){
				let tmpArr = JSON.parse( postpXhttp.responseText ) ; 
				let ppFxtrs = tmpArr[0]['unplanned'] ; 
				let rpFxtrs = tmpArr[1]['re-planned'] ; 
				/* 
					let iBreaks = tmpArr[4]['evtp-UIB'] ; 
					let evTpEFL = tmpArr[6]['evtp-EFL'] ;
					let evTpFAC = tmpArr[5]['evtp-FAC'] ;
					let evTpECL = tmpArr[7]["evtp-ECL"]
					console.log(getCI(), "getPostponedData evTpFAC:", evTpFAC.length );
				*/
				gamesOverview.postponedGames 	= [] ; 
				gamesOverview.postponedGameIds 	= [] ; 
				gamesOverview.replannedGames 	= [] ; 
				gamesOverview.replannedGamesIds = [] ; 
				gamesOverview.iBreaks 			= [] ; 
				// for(let br = 0; br < iBreaks.length; br++){ gamesOverview.iBreaks.push( iBreaks[br] ); }
				for(let bl = 0; bl < ppFxtrs.length ; bl++ ){
					gamesOverview.postponedGames.push( ppFxtrs[bl] ) ;
					gamesOverview.postponedGameIds.push( ppFxtrs[bl].ppid ) ;
					WSLTeamsFull[ ppFxtrs[bl].team_h_id ].ppgames.push( ppFxtrs[bl].ppid ) ;
					WSLTeamsFull[ ppFxtrs[bl].team_a_id ].ppgames.push( ppFxtrs[bl].ppid ) ;
				}

				for(let rp = 0; rp < rpFxtrs.length ; rp++ ){
					gamesOverview.replannedGames.push( rpFxtrs[rp] ) ;
					gamesOverview.replannedGamesIds.push( rpFxtrs[rp].ppid ) ;
				}

				setIndicator("ppsLdd-idc", "green") ; 
				myPPResolve( [ 	
					gamesOverview.postponedGames, 
					gamesOverview.replannedGames 
					/* , 
						iBreaks, 
						evTpEFL, 
						evTpFAC,
						evTpECL 
					*/
				]) ; 

			}else{
				setIndicator("ppsLdd-idc", "red") ; 
			}
		} 
	});
	return await postpndPrms ;
}

getFixtureData = async ()=> {
	let fxtrPrms = new Promise( ( myFxtrResolve )=> {
		// Only 1 subscriber awaiting this promise
		let fxtrXhttp = new XMLHttpRequest();
		/* "json/FPL_Events_current.json" */
		fxtrXhttp.open("GET", "json/WSL_Events_current.json", true ) ; 
		fxtrXhttp.send();
		fxtrXhttp.onreadystatechange = ()=>{
			if ( (fxtrXhttp.readyState == 4) && (fxtrXhttp.status == 200) ){
				let fxtrTableRaw = JSON.parse( fxtrXhttp.responseText ) ; 
				fixtureArray = sortByGmID( fxtrTableRaw ) ; 
				setIndicator("fxtrsLdd-idc", "green") ; 
				myFxtrResolve( fixtureArray ) ;
			}else{
				setIndicator("fxtrsLdd-idc", "red") ; 
			} 
		} 
	});
	return await fxtrPrms ;
}

getCupData = async (cupId)=> {
	/* 
	Cup order = 
		0: 	FA Cup 				( evtp-FAC )
		1: 	EFL Cup 			( evtp-EFL )
		2: 	Euro cHampions Lg 	( evtp-EHL )
		3: 	Euro eUropa Lg 		( evtp-EUL )
	*/
	// console.log("getCupData start ", cupId );
	let cupPrms = new Promise( ( myCupResolve )=> {
		let cupEvType = "evtp-" + cupId;
		let jsonFilename = "json/CUPS/cup-" + cupId + ".json" ;
		let cupXhttp = new XMLHttpRequest();
		cupXhttp.open("GET", jsonFilename, true ) ; 
		cupXhttp.send() ; 
		cupXhttp.onreadystatechange = ()=>{
			if ( (cupXhttp.readyState == 4) && (cupXhttp.status == 200) ){
				let cupResponse = JSON.parse( cupXhttp.responseText ) ; 
				// console.log("cupResponse", cupResponse ) ;
				cupDataAll[cupEvType] = cupResponse ;
				// console.log("cupDataAll", cupDataAll[cupEvType] ) ;
				myCupResolve( cupResponse ) ; 
			}
		} 
	});
	return await cupPrms ;
};

getStrengthData = async ()=>{
	let data = await fetch( "json/WSL_Strength_current.json" ).then( response => response.json() ) ;
	let scale = ( value, min, max, reverse=false ) =>
		Math.round( 1 + ( ( reverse ? max - value : value - min ) / ( max - min ) * 99 ) ) ;

	for( let loc of [ ["home", 0], ["away", 1] ] ){
		let teams = data.teams.map( team => ({
			id: team.id,
			attack: team[loc[0]].gf / team[loc[0]].mp,
			ga: team[loc[0]].ga / team[loc[0]].mp,
			cs: team[loc[0]].cs / team[loc[0]].mp
		}) ) ;

		let range = key => [
			Math.min( ...teams.map( team => team[key] ) ),
			Math.max( ...teams.map( team => team[key] ) )
		] ;

		let attackRange = range( "attack" ) ;
		let gaRange = range( "ga" ) ;
		let csRange = range( "cs" ) ;

		teams.forEach( team => {
			let attack = scale( team.attack, ...attackRange ) ;
			let defence = Math.round(
				( scale( team.ga, ...gaRange, true ) * 0.75 ) +
				( scale( team.cs, ...csRange ) * 0.25 )
			) ;

			WSLTeamsFull[team.id].strength[loc[1]] = {
				'loc': loc[0] == "home" ? "H" : "A",
				'overall': Math.round( ( attack + defence ) / 2 ),
				'attack': attack,
				'defence': defence
			} ;
		}) ;
	}

	return data ;
};
/*
#####################
#		Helpers		#	
#####################	
*/

getCurGW = ( allRounds )=>{
	if( allRounds.length > 0 ){
		for( let r = 0; r < allRounds.length; r++ ){
			if( allRounds[r].is_current ){
				curGW = parseInt( allRounds[r].id ) ;
				console.log( "getCurGW finds current: ", curGW, "\tin ", allRounds[r] ) ;
				gamesOverview.currentRnd = curGW ;
				return gamesOverview.currentRnd ;
			}
		}
	}

	curGW = 1 ;
	gamesOverview.currentRnd = curGW ;
	return gamesOverview.currentRnd ;
}

updateCellByTmIdRnd = ( fxtr, loc )=>{
	let lclRound = fxtr.postponed ? fxtr.ogGW : fxtr.event ;
	let target_td, target_txt, target_fplDF, target_fcell

	/* target_arr is a html element 'span' */
	let target_arr = [	"<span", 
						" teamId_h=" + fxtr.team_h,
						" teamId_a=" + fxtr.team_a,
						" fxtrid=" + fxtr.id,
						" evrnd=" + lclRound,
						" class='fxtrspan'", 
						" loc=", loc,
						" str_h_o=", fxtr.str_h_o,
						" str_h_a=", fxtr.str_h_a,
						" str_h_d=", fxtr.str_h_d,
						" str_a_o=", fxtr.str_a_o,
						" str_a_a=", fxtr.str_a_a,
						" str_a_d=", fxtr.str_a_d,
						" ev_df_df=", fxtr.ev_df_df ,
						" str_a_saldo=", fxtr.str_a_saldo,
						" str_h_saldo=", fxtr.str_h_saldo,
						" fpl_df_scr=", parseInt( ( fxtr.str_h_d - fxtr.str_a_a ) + ( fxtr.str_h_a - fxtr.str_a_d) ) ,
						" onclick=highlightEvent(",fxtr.id,")",
						" onmouseenter=highLightTmStrengths(",fxtr.team_h.toString(),",",fxtr.team_a.toString(),")",
						" onmouseleave=normalTmStrengthsHL()",
						" plyd='", ( fxtr.finished === true ), "'",
						" ppgame='", ( fxtr.postponed === true ), "'",
						" ></span>"
						].join("") ; 

	let fxtrSpan = $( target_arr ) ;

	if( loc == "H" ){
		/* Here we isolate the Home team row and gameweek column for this fixture */
		target_fcell = $("#eventTable tr[tmId=" + fxtr.team_h +"] td[evrnd=" + lclRound + " ].evtp-WSL ") ;
		if( target_fcell.length>1 ){
			/* Because sometimes (fxtr.event is set to null when fxtr is postponed) above selector includes the fixed columns */
			$.each( target_fcell, function(i,fcell){ if( parseInt($(fcell).attr("fxtrid") ) != 999 ){ target_td = $(fcell); } } ); 
		}else{ 
			target_td = target_fcell; 
		}
		target_txt = [ fxtr.team_a_nm, loc, ["(", WSLTeamsFull[ fxtr.team_a ].ownDFhis[ lclRound ], ")"].join("") ].join(" ") ;
		$(fxtrSpan).attr( "df", WSLTeamsFull[ fxtr.team_a ].ownDFhis[ lclRound ]   ) ;
		$(fxtrSpan).text( target_txt ) ;
		
   }else{
		/* Here we isolate the Home team row and gameweek column for this fixture */
		target_fcell = $("#eventTable tr[tmId=" + fxtr.team_a +"] td[evrnd=" + lclRound + " ].evtp-WSL " ) ;

		if( target_fcell.length>1 ){
			/* Because sometimes (fxtr.event is set to null when fxtr is postponed) above selector includes the fixed columns */
			$.each( target_fcell, function(i,fcell){ if( parseInt($(fcell).attr("fxtrid") ) != 999 ){ target_td = $(fcell); }} ); 
		}else{ 
			target_td = target_fcell; 
		}
		
		target_txt = [ fxtr.team_h_nm, loc, ["(", WSLTeamsFull[ fxtr.team_h ].ownDFhis[ lclRound ] , ")"].join("") ].join(" ") ;
		$(fxtrSpan).attr( "df", WSLTeamsFull[ fxtr.team_h ].ownDFhis[ lclRound ]  ) ;
		$(fxtrSpan).text( target_txt ) ; 
	}

	let ttlText = 	[
		"fxtr.id:", fxtr.id, 
		"homeDF[gw]:", WSLTeamsFull[ fxtr.team_h ].ownDFhis[ lclRound ],
		"awayDF[gw]:", WSLTeamsFull[ fxtr.team_a ].ownDFhis[ lclRound ],
		"\nHome attack v Away defence:", ( WSLTeamsFull[fxtr.team_h].strength[0]['attack']-WSLTeamsFull[fxtr.team_a].strength[1]['defence']).toString(), 
		"\nHome defence v Away attack:", ( WSLTeamsFull[fxtr.team_h].strength[0]['defence']-WSLTeamsFull[fxtr.team_a].strength[1]['attack']).toString(), 
		"\nHvA diff:",(( WSLTeamsFull[fxtr.team_h].strength[0]['attack']-WSLTeamsFull[fxtr.team_a].strength[1]['defence'])+(WSLTeamsFull[fxtr.team_h].strength[0]['defence']-WSLTeamsFull[fxtr.team_a].strength[1]['attack'])).toString(),
	].join("\t") ;

	$( fxtrSpan ).attr( "title", ttlText ) ;
	$( fxtrSpan ).attr( "tooltip", ttlText ) ;
	if( $(target_td).children(".fxtrspan").length > 0 ){ $(target_td).attr("dblgw", true ).addClass('highlight') ;}
	$(fxtrSpan).appendTo( $(target_td) ) ;
	$(target_td).attr("fxtrCount", $(target_td).children(".fxtrspan").length ) ;
}

handlePostponed = (fxtr, loc)=>{
	/* remove fxtr if already added to team row r27 */
	/* adds div elements to the td in the fxtrTbl table column round 27 */
	let fxtrppExists, pptarget_td, pptarget_div, pptarget_txt, pptarget_count;
	fxtrppExists = $("#fxtrTbl span.fxtrspan[evrnd='27'][loc='"+ loc +"'][fxtrid=" + fxtr.id + "]").remove();
	let pptarget_arr = ["<span", 
						" teamId_h=", fxtr.team_h,
						" teamId_a=", fxtr.team_a,
						" fxtrid=", fxtr.id,
						" evrnd=", fxtr.event /* should always be 27 */,
						" ogevrnd=", fxtr.ogGW, 
						" nwevrnd=", fxtr.event,
						" class='fxtrspan evtTeamBlock ppgame'", 
						" loc=", loc,
						" onclick=highlightEvent(",fxtr.id,")",
						" plyd=", fxtr.finished,
						" ppgame=", fxtr.postponed, "></span>"].join("");

	let ppfxtrSpan = $( pptarget_arr );
	$( ppfxtrSpan ).attr("df", 0) ; // 0 because postponed

	if( loc == "H" ){
		pptarget_td		= $("#fxtrTbl tr[tmId=" + fxtr.team_h +"] td[evrnd=" + fxtr.event + "]") ;
		pptarget_count 	= WSLTeamsFull[fxtr.team_h].ppgames.length;
		pptarget_txt	= [ "R", fxtr.ogGW, ":", fxtr.team_a_nm," ", loc ].join("") ;  /* fxtr.fplDF[0]  ||  */
		$(ppfxtrSpan).attr("title", pptarget_txt + " " + fxtr.reason ) ;
		$(ppfxtrSpan).text(pptarget_txt) ;
	}else{
		pptarget_td 	= $("#fxtrTbl tr[tmId=" + fxtr.team_a +"] td[evrnd=" + fxtr.event + "]") ;
		pptarget_count 	= WSLTeamsFull[fxtr.team_a].ppgames.length;
		pptarget_txt 	= [ "R", fxtr.ogGW, ":", fxtr.team_h_nm," ", loc ].join("") ; /* fxtr.fplDF[1]  ||  */
		$(ppfxtrSpan).attr("title", pptarget_txt + " " + fxtr.reason ) ;
		$(ppfxtrSpan).text(pptarget_txt) ;
	}

	target_td_divC = $( pptarget_td ).children("div.fxtrPPcount") ;
	target_td_divP = $( pptarget_td ).children("div.fxtrPPlist") ;
	$( ppfxtrSpan ).appendTo( $( target_td_divP ) );
	// Update fixture table team row pp count.
	$( target_td_divC ).text( pptarget_count );
}

buidPPContainer = ( treatedPPData )=>{ 
	/* adds li elements to the ul in the ppGamesAcc container (Unplanned) */ 
	let ptrgt 	= $( "#ppGamesAcc" ).get() ; 
	let dsplc 	= $( "#ppGamesAcc" ).children("li").remove() ;
	let ppArr 	= [] ; 

	for( let f = 0; f < treatedPPData[0].length; f++ ){
		let fxtr = treatedPPData[0][f] ; 
		/* 
			"<span>Link:  ", fxtr.link ,"</span>",
		*/

		ppArr =["<li title='", fxtr.ppid , "'><button fxtrId='",fxtr.ppid,"' onclick=openPPInfo(",fxtr.ppid,") style='color:#FF3300 !important; background-color:#000000 !important;' >", 
						"R ", fxtr.ogGW, "\t", fxtr.team_h_nm, "\tvs\t", fxtr.team_a_nm,"\t\t", fxtr.reason, 
						"</button>",
					"</li>"
				].join("") ; 

		let ppFxtrLi = $( ppArr ) ; 
		$( ppFxtrLi ).appendTo( $( ptrgt ) ) ; 	
	}

	/* adds li elements to the ul in the ppGamesAcc container (Replanned) */
	let rtrgt 	= $( "#rpGamesAcc" ).get() ; 
	$( "#rpGamesAcc" ).children("li").remove() ;
	let rpArr 	= [] ; 

	for( let r = 0; r < treatedPPData[1].length; r++ ){
		let fxtr = treatedPPData[1][r] ; 
		rpArr = [	"<li title='", fxtr.ppid ,
					"'><span>GW: ", fxtr.nwRound,
					" og(", fxtr.ogGW,")", "\t", fxtr.team_h_nm, "\tVs\t", fxtr.team_a_nm, 
					"</span></li>"
				].join("") ; 

		let rpFxtrLi = $( rpArr ) ; 
		$( rpFxtrLi ).appendTo( $( rtrgt ) ) ; 
	}
	
	/* WSLTeamsFull[t].ppgames has been updated before getPostponedData was resolved */
	for(let t=1; t<WSLTeamsFull.length; t++){ 
		$("#teamDF-cnt tr.pp_count td[tmId=" + t +"]").text( WSLTeamsFull[t].ppgames.length ); 
	}
}

setDFTeam = (tmId, df )=>{
	/*
		Updates the DF table in #teamDF-cnt at initial load. Once all fixtures are loaded df's are updatedfrom current gameweek backwards.
	*/
	let tmDFCritH = "#df_home td[tmId="+tmId+"]" ;
	let tmDFCritA = "#df_away td[tmId="+tmId+"]" ;
	let cellJQH = $( tmDFCritH ).get() ;
	let cellJQA = $( tmDFCritA ).get() ;
	/*
		console.log(
			"setDFTeam tmId: ", tmId, 
			"df H: ", df[0],
			"df A: ", df[1],
			"cellJQH.length", cellJQH.length,
			"cellJQA.length", cellJQA.length
		) ;
	*/
	if( cellJQH.length == 1 ){
		$(cellJQH).attr( "df", df[0] ) ;
		$(cellJQH).text( df[0] ) ;
	}
	if( cellJQA.length == 1 ){
		$(cellJQA).attr( "df", df[1] ) ;
		$(cellJQA).text( df[1] ) ;
	}
}

setDFTableStrength = ( eId, tmId, intStrength )=>{
	// 	updates the value and attribute of table rows
	// 	eId = elementId of the table row 
	// 	away-team: #tr_str_a_o ( strength-away-overall ), #tr_str_a_a ( strength-away-attack ), #tr_str_a_d ( strength-away-defence )
	// 	home-team: #tr_str_h_o ( strength-home-overall ), #tr_str_h_a ( strength-home-attack ), #tr_str_h_d ( strength-home-defence ) 
	let crit = [ "#"+eId , "td[tmId="+tmId+"]" ].join(" ") ; 
	let tr_sel = $( crit ) ;
	// the 'td' element's attributes are named as their tr-parent's ID minus the prefix 'tr_'
	// So the attribute-name of the td element 'tr_str_a_o' will be 'str_a_o' 
	let attrNm = eId.replace("tr_", "" ) ;
	// Only 1 element should meet the criteria
	if( tr_sel.length == 1 ){
		$( tr_sel ).attr( attrNm , intStrength.toString() ) ; 
		$( tr_sel ).text( intStrength.toString() ) ; 
		$( tr_sel ).css( "backgroundColor", linearScale(intStrength) ) ; 
	}else{
		console.log( getCI(), "setDFTableStrength -> tr_sel.length != 1 | Eid=", eId, "tmId=", tmId, "intStrength=", intStrength ) ; 
	}
}

isWSL = ( tmNr )=>{ return 	( ( tmNr > 0 ) && ( tmNr < WSLTeamsFull.length ) ) ; }

updateCupCell = ( tmId, gw, evtClass, roundTitle, cellText )=>{
	let cupCelltd = $( "#eventTable tr[tmId=" + tmId + "] td[evrnd='" + gw + "']." + evtClass )
		.filter(function(){ return $(this).attr("round") == roundTitle ; })
		.get() ;

	if( evtClass == "nocheck" ){
		console.log(
			getCI(),
			"updateCupCell", evtClass,
			"gw", gw,
			"round", roundTitle,
			"tmId", tmId,
			"text", cellText,
			"cupCelltd len", cupCelltd.length,
			"cupCelltd", $(cupCelltd)
		) ;
	}

	if( cupCelltd.length == 1 ){
		// All cup ties have difficulty factor 4.
		let cupTieArr = [	"<span",
							" tmId=", tmId,
							" df=4",
							" evrnd=", gw,
							" class='fxtrspan'",
							" >", cellText ,"</span>"
							].join("") ;

		let cupTie_jq = $( cupTieArr ) ;

		$( cupCelltd ).removeClass("cupElim") ;
		$( cupCelltd ).removeClass("cupCntndr") ;
		$( cupTie_jq ).addClass( evtClass ) ;

		if( [ "bye", "BYE" ].includes(cellText) ){ $( cupTie_jq ).addClass("drawBye") ; }

		if( cellText == "Elim" || cellText == "DNQ" ){
			$( cupCelltd ).addClass("cupElim") ;
			$( cupTie_jq ).addClass("cupElim") ;
		}else{
			$( cupCelltd ).addClass("cupCntndr") ;
			$( cupTie_jq ).addClass("cupCntndr") ;
		}

		$( cupCelltd ).append( cupTie_jq ) ;
	}
}

handleCups = ( cupData )=>{
	/*
		IN: qualified and not eliminated.
		OUT: did not qualify for the competition.
		cupRound.elim: qualified, but already eliminated before this round.

		DNQ is now supplied by CSS for empty cup cells.
		Only contenders, eliminated teams, drawn opponents and byes create spans.
	*/

	let cupIn = cupData[0]["data"] ;
	let whichCup = cupData[2]["data"] ;

	// Cup rounds start after IN, OUT, evntTp and GAMEWEEKS.
	for( let ck = 4; ck < cupData.length; ck++ ){
		let cupRound = cupData[ck] ;
		let cupGW = parseInt( cupRound["gw"] ) ;

		// Round 27 means the cup round has not been assigned to an FPL gameweek yet.
		if( cupGW == 27 ){ continue ; }

		let roundTitle = cupRound["title"] ;
		let cupDrawn = cupRound["drawn"] ;

		// Eliminated teams replace the CSS DNQ default with Elim.
		for( let cupTmId of cupRound["elim"] ){
			updateCupCell( cupTmId, cupGW, whichCup, roundTitle, "Elim" ) ;
		}

		if( cupDrawn ){
			// A draw has been made for this round.
			for( let evf = 0; evf < cupRound["data"].length; evf++ ){
				let evFxtr = cupRound["data"][evf] ;
				let tmHisWSL = isWSL( parseInt(evFxtr["team_h"]) ) ;
				let tmAisWSL = isWSL( parseInt(evFxtr["team_a"]) ) ;
				let tmHName = tmHisWSL ? WSLTeamsFull[ evFxtr["team_h"] ]["shortNm"] : evFxtr["oppNmH"] ;
				let tmAName = tmAisWSL ? WSLTeamsFull[ evFxtr["team_a"] ]["shortNm"] : evFxtr["oppNmA"] ;
				let rpl = evFxtr["replay"] ? " (replay)" : "" ;

				if( tmHisWSL ){ updateCupCell( evFxtr["team_h"], cupGW, whichCup, roundTitle, tmAName + rpl ) ; }
				if( tmAisWSL ){ updateCupCell( evFxtr["team_a"], cupGW, whichCup, roundTitle, tmHName + rpl ) ; }
			}
		}else{
			// No draw yet: qualified contenders replace the CSS DNQ default.
			for( let cupTmId of cupIn ){
				updateCupCell( cupTmId, cupGW, whichCup, roundTitle, roundTitle ) ;
			}
		}
	}
}

getOrigPPRnd = ( fxtrId )=>{
	if( gamesOverview.postponedGames.length > 0 ){
		for( let f=0; f<gamesOverview.postponedGames.length; f++){
			if( parseInt( gamesOverview.postponedGames[f].ppid ) == parseInt(fxtrId) ){ 
				return gamesOverview.postponedGames[f].ogGW;
			}
		}
	}
}

getOrigPPRsn = ( fxtrId )=>{
	if(gamesOverview.postponedGames.length>0){
		for( let f=0; f<gamesOverview.postponedGames.length; f++){
			if( parseInt( gamesOverview.postponedGames[f].ppid ) == parseInt(fxtrId) ){ 
				return gamesOverview.postponedGames[f].reason; 
			}
		}
	}
}

sortByGmID = ( evArr )=>{
	let retArr = evArr.sort(
		(a, b)=>{
			let A = a.id;
			let B = b.id;
			if (parseInt(A) < parseInt(B)) { return -1; }
			if (parseInt(A) > parseInt(B)) { return 1; }
			return 0;
		}) ; 
	return retArr;
}

getTmDfGwLoc = (tmId, gw=gamesOverview.currentRnd)=>{return [ WSLTeamsFull[tmId].fplDF[0], WSLTeamsFull[tmId].fplDF[1] ] ;}

setFPLdfToGW = (gw=gamesOverview.currentRnd)=>{
	for( let t=1; t<WSLTeamsFull.length; t++ ){	WSLTeamsFull[t]['fplDF'] = getTmDfGwLoc(t,gw)}
}

buildHeaders = ( events )=>{
	let headerRow = $("#fxtrTblHdr > tr") ;
	let postponedHeader = headerRow.children("th.ppgame") ;

	// Keep the three fixed control headers and the final postponed header.
	headerRow.children("th.evtTeamBlock").remove() ;

	for( let event of events ){
		let gw = parseInt( event["id"] ) ;
		let gwHeaders = [{
				"eventType": "evtp-WSL",
				"evrnd": gw,
				"date": event["deadline_time"].substring(0, 16).replace("T", " "),
				"round": "GW " + gw.toString().padStart(2, "0")
		}] ;

		for( let cupEventType in cupDataAll ){
			let cupData = cupDataAll[cupEventType] ;
			// Cup and UIB rounds start after IN, OUT, evntTp and GAMEWEEKS.
			for( let ci = 4; ci < cupData.length; ci++ ){
				let cupRound = cupData[ci] ;
				let cupGW = parseInt( cupRound["gw"] ) ;

				if( cupGW == 27 || cupGW != gw ){ continue ; }

				gwHeaders.push({
					"eventType": cupEventType,
					"evrnd": cupGW,
					"date": cupRound["date"],
					"round": cupRound["title"]
				}) ;
			}
		}

		// WSL, cups and UIB items assigned to this GW are ordered together by date.
		gwHeaders.sort(( a, b )=>{ return new Date(a["date"]) - new Date(b["date"]) ; }) ;

		for( let headerData of gwHeaders ){
			$("<th>")
				.attr({
						"evrnd": headerData["evrnd"],
						"date": headerData["date"],
						"round": headerData["round"]
				})
				.addClass("evtTeamBlock " + headerData["eventType"])
				.text(headerData["round"])
				.insertBefore(postponedHeader) ;
		}
	}
}

buildSkeleton = ( tmId )=>{
	let tm = WSLTeamsFull[tmId] ;
	let tmShort = tm["shortNm"] ;
	let tmName = tm["longNm"] ;

	let tmRow = $("<tr>")
		.attr({
				"id": tmShort,
				"tmId": tmId
		})
		.addClass("tmSelected rowShow") ;

	$("<span>")
		.text(tmName)
		.on("click", ()=>{ highlightTeamEvents(tmShort) ; })
		.appendTo(
			$("<th>")
				.addClass("evntTblTmNmHdr")
				.appendTo(tmRow)
		) ;

	$("<div>")
		.addClass("tm-idc greenLight")
		.appendTo(
			$("<th>")
				.on("click", ()=>{ tmSelectToggle(tmId) ; })
				.appendTo(tmRow)
		) ;

	$("<th>")
		.addClass("dfc")
		.text("100")
		.appendTo(tmRow) ;

	$("#fxtrTblHdr > tr > th.evtTeamBlock").each(
		function(){
			let eventHdrCell = $(this) ;
			let eventType = eventHdrCell
				.attr("class")
				.split(" ")
				.find(( className )=>{ return className.startsWith("evtp-") ; }) ;

			$("<td>")
				.attr({
						"evrnd": eventHdrCell.attr("evrnd"),
						"round": eventHdrCell.attr("round")
				})
				.addClass("evtTeamBlock " + eventType)
				.appendTo(tmRow) ;
		}
	) ;

	let postponedCell = $("<td>")
		.attr("evrnd", 27)
		.addClass("ppgame")
		.appendTo(tmRow) ;

	$("<div>").addClass("fxtrPPcount").appendTo(postponedCell) ;
	$("<div>").addClass("fxtrPPlist").appendTo(postponedCell) ;

	tmRow.appendTo("#eventTable") ;
}

/*
#####################
#	 DATA READY		#
#####################
values order:
 0: getStaticData()
 1: getPostponedData
 2: getFixtureData
 3: getCupData("FAC")
 4: getCupData("EFL")
 5: getCupData("EHL")
 --> 6: getCupData("EUL") not loaded
 6: getCupData("UIB")
*/

const allPromise = 	Promise.all( 
						[ 	
							getStaticData(), 
							getPostponedData(), 
							getFixtureData(),
							getCupData("FAC"), 
							getCupData("EFL"), 
							getCupData("EHL"),
							// getCupData("EUL"),
							getCupData("UIB"),
							getStrengthData()
						] 
					) ; 

allPromise.then(

	(values) => {

		console.log( getCI(),"allPromise.then -->" ) ;

		let events 	= values[0]['events'] ; 
		let teams 	= values[0]['teams'] ; 
		let ppGames = values[1] ; 
		let fxtrs 	= values[2] ;
		console.log( 
			getCI(), 
			"values: events: ", events.length, 
			"teams:", teams.length, 
			"UNplanned:", ppGames[0].length, 
			"REplanned:", ppGames[1].length, 
			"fxtrs:", fxtrs.length 
		) ; 

		let cup_FAC 	= values[3] ; 
		let cup_EFL 	= values[4] ; 
		let cup_EHL 	= values[5] ;
		// let cup_EUL 	= values[6] ;
		let cup_UIB 	= values[6] ;

		// Step 2 : Add data from ppGames to fxtrs. 		( 	FXTR LOOP 	)	-origGw, -reason, -newGW(27), -postponed(true/false) 
		// Step 4 : Add data from fxtrs to WSLTeamsFull.	( 	FXTR LOOP 	)	-hisDF
		// Step 5 : Add data from WSLTeamsFull to fxtrs.	( 	FXTR LOOP 	)	-FPL-DF -strengths 
		
		/* 
			console.log( "tmTbl['tables'][0][1]:", tmTbl['tables'][0]['gameWeek'] )
			gamesOverview.teamTableArr = tmTbl['tables'][0]['entries'] ;
			console.log( "teamTableArr:", gamesOverview.teamTableArr.length ) ;
		*/

		// Set the curGW at the earliest possibility
		curGW = getCurGW( events ) ;
		console.log( getCI(), "allPromise.then(values) curGw(events)", curGW ) ; 
		$("#curRound").text("GW: " + curGW.toString() ) ;

		console.log( getCI(), "allPromise.then(values) events --> buildHeaders" ) ; 
		buildHeaders(events) ;
		$("#eventTable").empty() ;
		console.log( "WSL strength test:", WSLTeamsFull[1].strength ) ;

		// TEAM LOOP START 
		// old: for (let t=0; t<teams.length; t++){
		// new: for( t in teams ){ 
		for( let t in teams ){ 			
			// 2 sources for 1 array:
			// FPL data
			let fpl_tm 		= teams[t] 		;
			let fpl_tmId 	= fpl_tm.id 	;

			// Our data from CONSTANTS.WSLTeamsFull
			let jtf_tm 		= WSLTeamsFull[fpl_tmId] ; 
			let jtf_tmId 	= jtf_tm.id ; 

			buildSkeleton(fpl_tmId) ;

			// STEP 1
			// The strength_overall values from FPL don't compute. 
			// Therefore  we do int((attack+defence)/2) for both home- and away overall values )

			jtf_tm.staticTmStrength = fpl_tm.strength ;

			// jtf_tm.strength[0]['overall'] 	= parseInt( ( fpl_tm.strength_attack_home + fpl_tm.strength_defence_home ) / 2 ) ;   
			// jtf_tm.strength[0]['attack'] 	= parseInt( fpl_tm.strength_attack_home ) ;  
			// jtf_tm.strength[0]['defence'] 	= parseInt( fpl_tm.strength_defence_home ) ;  
			// jtf_tm.strength[1]['overall'] 	= parseInt( ( fpl_tm.strength_attack_away + fpl_tm.strength_defence_away ) / 2 ) ;  
			// jtf_tm.strength[1]['attack'] 	= parseInt( fpl_tm.strength_attack_away ) ;  
			// jtf_tm.strength[1]['defence'] 	= parseInt( fpl_tm.strength_defence_away ) ;  
			// FPL provides tm_strength but isn't really used. Adding it anyway
			// jtf_tm.staticTmStrength 		= fpl_tm.strength ;

			// STEP 2
			// Change/Add strength values to html DF container home team
			setDFTableStrength( "tr_str_h_o", fpl_tmId, jtf_tm.strength[0]['overall'] ) ; 
			setDFTableStrength( "tr_str_h_a", fpl_tmId, jtf_tm.strength[0]['attack']  ) ; 
			setDFTableStrength( "tr_str_h_d", fpl_tmId, jtf_tm.strength[0]['defence']  ) ; 
			// Change/Add strength values to html DF container away team
			setDFTableStrength( "tr_str_a_o", fpl_tmId, jtf_tm.strength[1]['overall'] ) ; 
			setDFTableStrength( "tr_str_a_a", fpl_tmId, jtf_tm.strength[1]['attack']  ) ; 
			setDFTableStrength( "tr_str_a_d", fpl_tmId, jtf_tm.strength[1]['defence']  ) ; 
	
			setDFTeam( fpl_tmId, WSLTeamsFull[fpl_tmId]["fplDF"] ) ;
		} 

		gamesOverview.dfSource.loaded[0] = true ; 
		setIndicator("wsl-df-Ldd-idc", "green") ;
		setIndicator("wsl-ha-Ldd-idc", "green") ; 
		// TEAM LOOP END 

		console.log(getCI(), "allPromise.then(values) after TEAM LOOP -> hasUserStore", hasUserStore() ) ; 
		if( hasUserStore() ){ setIndicator("usr-df-Ldd-idc", "orange") ; }

		// PPgames START 
		buidPPContainer( ppGames ) ; 
		// PPgames END 

		// FXTRS (WSL) LOOP START
		for(let f=0; f<fxtrs.length; f++){

			let fxtr = fxtrs[f] ; 
			let tmHomeId = fxtr.team_h ;
			let tmAwayId = fxtr.team_a ;
			let agw = fxtr.event ; 

			if( gamesOverview.postponedGameIds.includes( fxtr.id ) ){

				fxtr.event 		= 27 ;
				fxtr.postponed 	= true ;
				fxtr.ogGW 		= getOrigPPRnd( fxtr.id ) ; 
				fxtr.reason 	= getOrigPPRsn( fxtr.id ) ; 
				fxtr.finished 	= false ; 
				fxtr.finished_provisional = false ; 
				fxtr.kickoff_time = "2027-06-30T15:00:00Z" ; 
				fxtr.minutes 	= 0 ; 
				fxtr.provisional_start_time = false ; 
				fxtr.started 	= false ; 
				agw 			= fxtr.ogGW ; 

			}else{

				fxtr.postponed = false ;

			}

			// Add the teams' default DF factors per round from WSLTeamsFull.
			let homeDF = WSLTeamsFull[ tmHomeId ].fplDF[0] ;
			let awayDF = WSLTeamsFull[ tmAwayId ].fplDF[1] ;

			WSLTeamsFull[ tmHomeId ].ownDFhis[ agw ] = homeDF ;
			WSLTeamsFull[ tmHomeId ].oppDFhis[ agw ] = awayDF ;

			WSLTeamsFull[ tmAwayId ].ownDFhis[ agw ] = awayDF ;
			WSLTeamsFull[ tmAwayId ].oppDFhis[ agw ] = homeDF ;

			// Adding team info to fixtures
			fxtr.team_h_nm = WSLTeamsFull[ tmHomeId ].shortNm ;
			fxtr.team_a_nm = WSLTeamsFull[ tmAwayId ].shortNm ;

			// Use WSLTeamsFull defaults for FPL and user DF values.
			fxtr.fplDF = [ awayDF, homeDF ] ;
			fxtr.usrDF = [ WSLTeamsFull[ tmHomeId ].usrDF[0], WSLTeamsFull[ tmAwayId ].usrDF[1] ] ;

			// console.log(" fxtr.fpl_df_h_o", allStatsData['teams'][ 1].strength_overall_home ) ;
			// Home team
			fxtr.str_h_o 	 = WSLTeamsFull[ tmHomeId ].strength[0]['overall'] ; 
			fxtr.str_h_a 	 = WSLTeamsFull[ tmHomeId ].strength[0]['attack'] ; 
			fxtr.str_h_d 	 = WSLTeamsFull[ tmHomeId ].strength[0]['defence'] ; 
			// Away team
			fxtr.str_a_o 	= WSLTeamsFull[ tmAwayId ].strength[1]['overall'] ; 
			fxtr.str_a_a 	= WSLTeamsFull[ tmAwayId ].strength[1]['attack'] ; 
			fxtr.str_a_d 	= WSLTeamsFull[ tmAwayId ].strength[1]['defence'] ; 

			fxtr.str_h_saldo = (( fxtr.str_h_a - fxtr.str_a_d ) + ( fxtr.str_h_d - fxtr.str_a_a )) ;  
			fxtr.str_a_saldo = (( fxtr.str_a_a - fxtr.str_h_d ) + ( fxtr.str_a_d - fxtr.str_h_a )) ;  

			// console.log( getCI(), "allPromise.then(values) f: ", fxtr.id, " fxtr.str_h_saldo: ", fxtr.str_h_saldo ) ; 
			// console.log( getCI(), "allPromise.then(values) f: ", fxtr.id, " fxtr.str_a_saldo: ", fxtr.str_a_saldo ) ; 

			// See which fixtures have the biggest DF difference 
			fxtr.ev_df_df = Math.abs( homeDF - awayDF ) ;

			// Build the fixture table
			updateCellByTmIdRnd( fxtr, "H") ; 
			updateCellByTmIdRnd( fxtr, "A") ; 
			if( fxtr.postponed ){ 
				handlePostponed( fxtr, "H" ) ; 
				handlePostponed( fxtr, "A" ) ; 
			}
		}

		// FXTRS (WSL) LOOP END
		setIndicator("df-Ldd-idc", "green") ; 
		// setFPLdfToGW( curGW ) ;
		// CUP FIXTURES LOOP START
		console.log( 
			getCI(), 
			"---CUPS---\N",
			"cup_FAC", cup_FAC.length, 
			"cup_EFL", cup_EFL.length, 
			"cup_EHL", cup_EHL.length, 
			// "cup_EUL", cup_EUL.length, 
			"cup_UIB", cup_UIB.length
		) ; 

		for ( let cupAllDataItem in cupDataAll ){ 
			console.log("allCupsPrms.then | cupAllDataItem: ", cupAllDataItem, " starting handleCups length: ", cupDataAll[cupAllDataItem].length );
			handleCups( cupDataAll[cupAllDataItem], cupAllDataItem ) ; 
		}

		loadWSLDF() ;
		// CUP FIXTURES LOOP END
		console.log("\nHTML init -> Promise all END") ;
		setFPLdfToGW( curGW ) ;
		showEventWindow(2, "HTML init") ;
		eventTypeMidweekChanged();
	}

)
.catch( 
	(error) => {
		console.log(error); // rejectReason of any first rejected promise
	}
);