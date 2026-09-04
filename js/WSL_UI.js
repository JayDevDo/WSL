// wsl_UI.js

tmNmClick = (tmId)=>{ 

	gamesOverview.selectedTeamId = tmId ;

	let ls_tmdfbarchart = [] ;
	let e ;
	for( e=1; e < 27; e++ ){
		ls_tmdfbarchart.push( {'gw': e, 'df': WSLTeamsFull[tmId]['ownDFhis'][e] } );
	}

	localStorage.tmdfbarchart = JSON.stringify( ls_tmdfbarchart ) ;
	let lsSize = JSON.parse(localStorage.tmdfbarchart).length ;

	console.log("tmNmClick tmId", tmId , WSLTeamsFull[tmId]["altNm"], "locstore Size:", lsSize ) ;
	window.open("teamDFBarChart.html?tmId="+tmId.toString(), WSLTeamsFull[tmId]["altNm"]  ) ;
}

removeHLClass = (clsNm)=>{ $("."+clsNm).removeClass(clsNm) ;}
showEvent = (id)=>{ for(let e=0; e < fixtureArray.length; e++){ if( fixtureArray[e].id == id ){ return fixtureArray[e] ; }}}
locked = ()=>{ return gamesOverview.locks.includes( true ) ; }
isLocked = (l)=>{ return gamesOverview.locks[l] == true || false ; }
let evchanges = [ "start", "round", "end" ] ;

// Event window toggles

toggleLocks = (l)=>{

	switch(l){
		case 0:
			gamesOverview.locks[0] = !gamesOverview.locks[0];
			if( gamesOverview.locks[0] ){
				gamesOverview.locks[1] = false;
				gamesOverview.locks[2] = false;
				gamesOverview.evWndw['direction'] = 1 ;
			}
			break;

		case 1:
			gamesOverview.locks[1] = !gamesOverview.locks[1];
			if( gamesOverview.locks[1] ){
				gamesOverview.locks[0] = false;
				gamesOverview.locks[2] = false;
			}
			break;

		case 2:
			gamesOverview.locks[2] = !gamesOverview.locks[2];
			if( gamesOverview.locks[2] ){
				gamesOverview.locks[0] = false;
				gamesOverview.locks[1] = false;
				gamesOverview.evWndw['direction'] = -1 ;
			}
			break;

		default: 
			// console.log( getCI(), "toggleLocks l = ", l );
	}

	let lckBttns = $("button.evwndwTgl").get() ;

	$.each(
		lckBttns,
		function(i,b){
			$(b).attr('enabled', gamesOverview.locks[i] )
		}
	);
}

setEventWndwStart = (ews)=>{
	gamesOverview.evWndw['start'] = parseInt(ews);
	showEventWindow(0,"setEventWndwStart");
	return gamesOverview.evWndw['start'];
} ;

setRndsToShow = (rts)=>{
	gamesOverview.evWndw['rounds'] = parseInt(rts);
	showEventWindow(1,"setRndsToShow");
	return gamesOverview.evWndw['rounds'];
};

setEventWndwEnd = (ewe)=>{
	gamesOverview.evWndw['end'] = parseInt(ewe);
	showEventWindow(2,"setEventWndwEnd");
	return gamesOverview.evWndw['end'];
}

showEventWindow = ( l, f )=>{
	// @param(l) = last changed selection item:
	// 0 = start, 1 = rounds, 2 = end
	// @param(f) = function that called this function
	let evWndw = gamesOverview.evWndw ;
	let lockId = gamesOverview.locks.indexOf( true ) ;
	let direction = parseInt( evWndw['direction'] ) ;
	let start = parseInt( evWndw['start'] ) ;
	let rounds = parseInt( evWndw['rounds'] ) ;
	let end = parseInt( evWndw['end'] ) ;

	if( locked() ){
		switch( lockId ){
			case 0:
				// Start is locked.
				if( l == 0 || l == 1 ){
					end = start + rounds - 1 ;
				}else if( l == 2 ){
					rounds = end - start + 1 ;
				}
				break ;

			case 1:
				// Number of rounds is locked.
				if( l == 0 ){
					end = start + rounds - 1 ;
				}else if( l == 1 ){
					if( direction == 1 ){
						end = start + rounds - 1 ;
					}else{
						start = end - rounds + 1 ;
					}
				}else if( l == 2 ){
					start = end - rounds + 1 ;
				}
				break ;

			case 2:
				// End is locked.
				if( l == 0 ){
					rounds = end - start + 1 ;
				}else if( l == 1 || l == 2 ){
					start = end - rounds + 1 ;
				}
				break ;
		}

	}else{
		switch( l ){
			case 0:
			case 1:
				end = start + rounds - 1 ;
				break ;
			case 2:
				rounds = end - start + 1 ;
				break ;
		}
	}

	evWndw['start'] = start ;
	evWndw['rounds'] = rounds ;
	evWndw['end'] = end ;

	$("#strtRnd > option.active").removeClass("active") ;
	$("#strtRnd > option.selected").removeClass("selected") ;
	$("#strtRnd").val( start ) ;
	$("#strtRnd > option[value='" + start + "']").addClass("active selected") ;

	$("#slctdRounds > option.active").removeClass("active") ;
	$("#slctdRounds > option.selected").removeClass("selected") ;
	$("#slctdRounds").val( rounds ) ;
	$("#slctdRounds > option[value='" + rounds + "']").addClass("active selected") ;

	$("#endRnd > option.active").removeClass("active") ;
	$("#endRnd > option.selected").removeClass("selected") ;
	$("#endRnd").val( end ) ;
	$("#endRnd > option[value='" + end + "']").addClass("active selected") ;

	for( let gw = 1; gw < start; gw++ ){
		hideEventClmn( gw ) ;
	}

	for( let gw = start; gw <= end; gw++ ){
		showEventClmn( gw ) ;
	}

	for( let gw = end + 1; gw <= 27; gw++ ){
		hideEventClmn( gw ) ;
	}

	if( gamesOverview.showPP ){
		togglePPdisplay( true, "showEventWindow true" ) ;
		$("tr.pp_count").show() ;
		showEventClmn( 27 ) ;
	}else{
		$("tr.pp_count").hide() ;
		togglePPdisplay( false, "showEventWindow false" ) ;
		hideEventClmn( 27 ) ;
	}

	updateTotalDF( changDFviewIdx ) ;
	eventTypeSelectionChanged() ;
	// console.log(
	// 	getCI(),
	// 	"called by", f,
	// 	"showEventWindow:", evWndw,
	// 	"changed", evchanges[l],
	// 	"to:", [ start, rounds, end ][l]
	// ) ;
}

hideEventClmn = (rnd)=>{
	/* 	Hides the GW columns */
	let crit = "td[evrnd=" + rnd + "]" ;
	let gms  = $(crit).get() ;
	let hdr  	= $("th[evrnd=" + rnd + "]" ) ;
	$.each( hdr, function(index,gm){ $(gm).addClass("clmnHide"); } ) ;
	$.each( gms, function(index,gm){ $(gm).addClass("clmnHide"); } ) ;
}

showEventClmn = (rnd)=>{
	/* 	Shows the GW columns */
	let crit = "td[evrnd=" + rnd + "]" ;
	let gms  = $(crit).get() ;
	let hdr  	= $("th[evrnd=" + rnd + "]" ) ;
	$.each( hdr, function(index,gmh){ 	$(gmh).removeClass("clmnHide"); } ) ;
	$.each( gms, function(index,gm){ 	$(gm).removeClass("clmnHide"); 	} ) ;
}

showEventType = ( evtClass )=>{
	let critTD = "td." + evtClass ;
	let critTH = "th." + evtClass ;
	let evTypeCells  = $(critTD).get() ;
	let evTypeHeads  = $(critTH).get() ;
	// console.log("showEventType: ", evtClass, " evTypeCells:\t", evTypeCells.length , "evTypeHeads:\t", evTypeHeads.length )
	$.each( evTypeHeads, function( index, hdr ){ $(hdr).removeClass("evtypeHide"); } );
	$.each( evTypeCells, function( index, cll ){ $(cll).removeClass("evtypeHide"); } );
}

hideEventType = ( evtClass )=>{
	let critTD = "td." + evtClass ;
	let critTH = "th." + evtClass ;
	let evTypeCells  = $(critTD).get() ;
	let evTypeHeads  = $(critTH).get() ;
	// console.log("hideEventType: ", evtClass, " evTypeCells:\t", evTypeCells.length , "evTypeHeads:\t", evTypeHeads.length )
	$.each( evTypeHeads, function( index, hds ){ $(hds).addClass("evtypeHide"); } );
	$.each( evTypeCells, function( index, cll ){ $(cll).addClass("evtypeHide"); } );
}

eventTypeMidweekChanged = ()=>{
	let cupTypes = $("#evntTpsCups input").get() ;
	let showMidweeks = $("#cupMidweek").get() ;
	/* 
	console.log(
		"eventTypeMidweekChanged", cupTypes.length, 
		"$(showMidweeks).checked ", $(showMidweeks)[0].checked 
	) ;
	*/
	$.each( 
		cupTypes,
		function( index, cupType ){ 
			// console.log("eventTypeMidweekChanged | loop cupTypes: ", cupType.id, cupType.checked, "midWeeks:", $(showMidweeks)[0].checked  ) ;
			
			if( $(showMidweeks)[0].checked ){
				if( cupType.checked ){
					showEventType( cupType.id ) ;
				}else{
					hideEventType( cupType.id ) ;
				}

			}else{
				hideEventType( cupType.id ) ;
			}

		}
	);
}

eventTypeSelectionChanged = ()=>{
	let evTypes = $("#evntTpsCont input").get() ;
	let showMidweeks = $("#cupMidweek").get() ;
	/*
	console.log(
		"eventTypeSelectionChanged", evTypes.length, 
		"$(showMidweeks).checked ", $(showMidweeks)[0].checked 
	) ;
	*/

	$.each( 
		evTypes,
		function( index, evtType ){ 

			// console.log("eventTypeSelectionChanged | evtType: ", evtType ) ; 

			if(evtType.checked){
				
				if( evtType.id == "cupMidweek" ){ 
					$("#evntTpsCups").show() ; 
				}else{					
					showEventType( evtType.id ) ;
				}
			}else{
				if( evtType.id == "cupMidweek" ){ 
					$("#evntTpsCups").hide() ; 
				}else{
					hideEventType( evtType.id ) ; 
				} ;
			}
		}
	);

	eventTypeMidweekChanged() ;

	/* With columns being hidden or shown, re-apply striped columns */
	let fxtrHdrs = $(".striped th.evtp-WSL").get() ;

	$.each(
		fxtrHdrs,
		function(index, fxtrHdr){
			if( $(fxtrHdr).hasClass("clmnHide") ){
				$(fxtrHdr).removeClass("unstriped") ;
				$(fxtrHdr).removeClass("striped") ;
			}else{
				(index%2==0)? $(fxtrHdr).addClass("striped"):$(fxtrHdr).addClass("unstriped") ;
			}
		}
	);
}

// User DF functions
setCustomDF = (loc, tmId)=>{	
	$("#popUpDF").attr( 'tmId', tmId )
	$("#puDF_tmSNm span").first().text( WSLTeamsFull[tmId].shortNm ) ;
	let offset = $("#df_away td[tmId="+tmId + "]").offset();
	$("#popUpDF").show()
	// $("#popUpDF").offset({ top: ( offset.top - 75 ), left: ( offset.left + ( parseInt(tmId) * 45 ) +50 ) });
	$("#popUpDF").offset({ top: ( offset.top - 75 ), left: offset.left });
}

updateCustomDF = (loc,val)=>{
	let crit ;
	let tmId = $("#popUpDF").attr("tmId") ; 
	console.log("shortNm: ", WSLTeamsFull[ tmId ].shortNm, "updateCustomDF: loc: ", loc, "val: ", val ) ; 
	let text = WSLTeamsFull[tmId].shortNm + " " + ((loc=="H")? "A":"H" ) + " (" + val + ")" ; 
	if(loc=="H"){
		crit = $(".fxtrspan[teamid_h="+tmId+"][loc='A']") ; 
		$("#df_home td[tmId=" + tmId + "]").text(val) ;
		$("#df_home td[tmId=" + tmId + "]").attr("df", val) ;	
	}else{
		crit = $(".fxtrspan[teamid_a="+tmId+"][loc='H']") ; 
		$("#df_away td[tmId=" + tmId + "]").text(val) ;
		$("#df_away td[tmId=" + tmId + "]").attr("df", val) ;
	}

	setUserDF() ; 

	let tmgames = $(crit).get() ;
	
	// console.log("updateCustomDF tmgames.len ", tmgames.length ) ; 
	$.each(
		tmgames,
		(index, gm)=>{
			$(gm).attr("df", val) ; 
			$(gm).addClass("customDF") ; 
			$(gm).text(text) ; 
		}
	);

	// changDFviewIdx from CONSTANTS 
	updateTotalDF(changDFviewIdx) ; 
}

// Change sorting option changDFviewIdx from CONSTANTS
changDFview = ()=>{
	if( (changDFviewIdx+1) > 3 ){
		changDFviewIdx = 0;
	}else{
		changDFviewIdx += 1;
	}
	updateTotalDF(changDFviewIdx) ; 
}

updateTotalDF = (dfType)=>{
	// dfType = ["sum", "count", "avg", "fpl"] 

	let tblRows = $(".teamCntnr tr").get();

	// Loop thru the 14 teams
	$.each(
		tblRows,
		(index, rw)=>{

			// Set up the totals for this team.
			let rwDFSum 		= 0 ;  // Holds the DF sum for the team row
			let rwMtchCount 	= 0 ;  // Holds the MatchCount for the team row
			let rwStrngthSum 	= 0 ;  // Holds the StrengthHome/Away total.

			// Define which GW's will be counted
			let strtRnd 	= gamesOverview.evWndw['start'] ; 
			let endRnd 		= gamesOverview.evWndw['end'] ; 
			let rowFixtures = $(rw).children(".evtp-WSL") ; 
			let tmId 		= parseInt( $(rw).attr("tmid") ); 

			/* console.log( getCI(), "updateTotalDF len rowFixtures  ", rowFixtures.length ) ; */

			// Loop thru the fixtures of this team.
			$.each(
				rowFixtures,
				function(i,gm){
					// Only count fixtures in the selected event window
					if( ( $(gm).attr("evrnd") >= strtRnd ) && ( $(gm).attr("evrnd") <= endRnd ) ){
						// Set up the totals for this GW.
						let tdHAstrngth = 0 ; 
						let tdMatchCount = 0 ; 
						let tdDFsum  = 0 ; 
						$.each(
							$(gm).children("span").get(),
							(s, spdf)=>{
								// Only count games that aren't postponed.
								if( $(spdf).attr("ppgame") == "false" ){
									if( tmId==0 ){
										/* console.log( 
											getCI(), "\t", WSLTeamsFull[tmId].shortNm , 
											"\nfxtrId:", $(spdf).attr("fxtrid") , "at home:", (tmId==parseInt( $(spdf).attr("teamid_h"))), 
											"each rowfixture --> \tstr_h_saldo: ", $(spdf).attr("str_h_saldo") ,
											"\tstr_a_saldo: ", $(spdf).attr("str_a_saldo") 
										) ; 
										*/
									}
									// The DF sum
									tdDFsum += parseInt( $(spdf).attr("df") ) ; 
									// The match count
									tdMatchCount++ ; 

									// The home vs away strengths
									let loc = $(spdf).attr("loc") ;
									let lcl_evDF = parseInt( $(spdf).attr("fpl_df_scr") ) ; 

									tdHAstrngth += ( tmId == parseInt( $(spdf).attr("teamid_h") ) )? parseInt( $(spdf).attr("str_h_saldo") ):parseInt( $(spdf).attr("str_a_saldo") ) ; 

									/*
									if( lcl_evDF < 0 ){
										// A negative value for lcl_evDF indicates the away team is stronger
										if( ( loc == "A" ) && ( parseInt( $(spdf).attr("teamid_a") ) == tmId ) ){
											//  i.e. 10 -= -1 = 11 
											tdHAstrngth -= lcl_evDF ;
										}else{
											//  i.e. 10 += -1 = 9
											tdHAstrngth += lcl_evDF ;
										}
									}else{
										//  lcl_evDF is zero or bigger. indicates the home team is stronger
										if( ( loc == "H" ) && ( parseInt( $(spdf).attr("teamid_h") ) == tmId ) ){
											//  i.e. 10 += 1 = 11 
											tdHAstrngth += lcl_evDF ;
										}else{
											//  i.e. 10 -= 1 = 9
											tdHAstrngth -= lcl_evDF ;
										}
									}
									*/
								}
							}
						);

						// Update teamTotal with GW total  
						rwDFSum 		+= tdDFsum  ;
						rwMtchCount 	+= tdMatchCount ;
						// console.log( getCI(), "rwStrngthSum before adding gameweek td: ", rwStrngthSum, "adding (+=) tdHAstrngth", tdHAstrngth ) ; 
						rwStrngthSum 	+= tdHAstrngth ;
						// console.log( getCI(), "rwStrngthSum after adding gameweek td: ", rwStrngthSum ) ; 
					}
				}
			);

			// All fixtures have been counted. Now Update column "DF"
			let dfAvg = ( parseInt(rwDFSum) / parseInt(rwMtchCount) ).toString().slice(0,4);
			let dfStr = ""

			if( dfType == 0 ){
				dfStr = rwDFSum.toString() ; 
			}else if( dfType == 1 ){
				dfStr = rwMtchCount.toString() ; 
			}else if( dfType == 2 ){
				dfStr = dfAvg.toString() ; 
			}else if( dfType == 3 ){
				dfStr = rwStrngthSum.toString() ; 
			}else{
				dfStr = rwDFSum.toString() ; 
			}

			$(rw).children("th.dfc").text( dfStr ) ; 
			$("#tmDFhdr").text( changDFviewArr[dfType] ) ; 
		}
	);
	sortTable() ; 
}

reverseSort = ()=>{ 
	gamesOverview.sort = gamesOverview.sort * -1 ; 
	sortTable() ; 
	$("#rvSortBttn").text( (gamesOverview.sort==1)? "DESC":"ASC"   ) ; 
}

sortTable = ()=>{
	let rows = $('#fxtrTbl tbody tr').get();
	rows.sort(function(a,b){return dfcSort(a,b);});
	$.each(rows, function(index,row){$('#fxtrTbl').children('tbody').append(row);});
}

sortByTmNm =()=>{
	let rows = $('#fxtrTbl tbody tr').get() ; 
	rows.sort( function (a, b){ return nameSort(a,b) ; } ) ; 
	$.each(rows,function(index,row){ $('#fxtrTbl').children('tbody').append(row); }); 
	let curSort = parseInt( $( "th.tmNameHdr" ).attr("sort") ) ;
	$( "th.tmNameHdr" ).attr( "sort", ( curSort * -1 ).toString() ) ;
}

nameSort = ( tmA, tmB )=>{
	let currentSort = parseInt( $( "th.tmNameHdr" ).attr("sort") ) ;
	let retVal = 0 ; 
	// let A = parseInt( $(tmA).attr('tmId') ) ;
	// let B = parseInt( $(tmB).attr('tmId') ) ;	
	let A = $(tmA).attr('id')  ;
	let B = $(tmB).attr('id')  ;	

	if (A < B){ retVal = (-1 * currentSort) ; } 
	if (A > B){ retVal = ( 1 * currentSort) ; } 
	return retVal ; 
}

dfcSort = ( tmA, tmB )=>{
	let currentSort = parseInt( gamesOverview.sort ) ;
	let retVal = 0 ; 
	let A = parseFloat( $(tmA).children('th.dfc').text() );
	let B = parseFloat( $(tmB).children('th.dfc').text() );
	if (A < B){ retVal = (-1 * currentSort) ; } 
	if (A > B){ retVal = ( 1 * currentSort) ; } 
	return retVal ; 
}

// selected teams functionality
rowFilter = (rf_option)=>{
	let selectedArray = gamesOverview.teamFilter ;
	// console.log( getCI(), "rowFilter\trf_option\t", rf_option ) ; 
	// console.log( getCI(), "rowFilter\tselected\t",	selectedArray.length ) ; 
	switch(rf_option){
		case "a": 	
			// console.log("rowFilter A: Show all teams" )
			for( let t=1; t<=14; t++){ showTeamRow( t ) ; }
			break;

		case "s": 
			// console.log("rowFilter S: Show selected teams" ) ;
			for( let t=1; t<=14; t++ ){ 
				if( selectedArray[t] ){
					showTeamRow( t ) ; 
				}else{
					hideTeamRow( t ) ; 
				}
			}
			break;

		case "h": 
			// console.log("rowFilter H: Hide selected teams" )
			for( let t=1; t<=14; t++ ){ 
				if( selectedArray[t] ){
					hideTeamRow( t ) ; 
				}else{
					showTeamRow( t ) ; 
				}
			}
			break;

		default:
			// console.log("rowFilter: rf_option default? =", rf_option ) ;	
	}
}

hideTeamRow = (tmId)=>{
	let row = $('#eventTable tr[tmId=' + tmId + ']').get();
	$(row).removeClass("rowShow") ; 
	$(row).addClass("rowHide") ; 
}

showTeamRow = (tmId)=>{
	let row = $('#eventTable tr[tmId=' + tmId + ']').get();
	$(row).removeClass("rowHide") ; 
	$(row).addClass("rowShow") ; 
}

tmSelectToggle = (tmId)=>{

	gamesOverview.teamFilter[tmId] = !gamesOverview.teamFilter[tmId] ;
	// console.log("tmSelectToggle ", tmId, gamesOverview.teamFilter[tmId] ) ;

	let tmBttn  = $( "#eventTable tr[tmId=" + tmId + "] ").get() ; 
	let tmIndic = $( "#eventTable tr[tmId=" + tmId + "] div.tm-idc").get() ; 
	let fltrOp  = $( "#slctdTeams" ).val() ; 

	if( ($(tmBttn).length==1) && ($(tmIndic).length==1) ){

		$( tmIndic ).removeClass( "yellowLight" ) ;
		$( tmIndic ).removeClass( "redLight" 	) ;
		$( tmIndic ).removeClass( "greenLight"  ) ; 
		$( tmIndic ).removeClass( "orangeLight" ) ; 
		$( tmBttn ).removeClass( "tmUnselected" ) ; 
		$( tmBttn ).removeClass( "tmSelected"   ) ; 

		if( gamesOverview.teamFilter[tmId] ){
			$(tmBttn).addClass("tmSelected") ; 
			$(tmIndic).addClass("greenLight") ; 
		}else{
			$(tmBttn).addClass("tmUnselected") ; 
			$(tmIndic).addClass("redLight") ; 
		}
	}
	rowFilter( fltrOp ) ;
}

// Team highlighting 
highLightTmStrengths = ( hTmId, aTmId )=>{
	let tmHtds = $("td[str_h_a], td[str_h_d], td[str_h_o]" ).get() ; 
	let tmAtds = $("td[str_a_a], td[str_a_d], td[str_a_o]" ).get() ; 
	$.each(
		tmHtds,
		(i, strtdH )=>{
			
			if(parseInt( $(strtdH).attr("tmId") ) == hTmId ){ 
				$(strtdH).removeClass("shaded") ; 
				$(strtdH).addClass("unShade") ; 
			}else{
				$(strtdH).addClass("shaded") ; 				
				$(strtdH).removeClass("unShade") ; 
			}
	});

	$.each(
		tmAtds,
		( i, strtdA )=>{
			if(parseInt( $(strtdA).attr("tmId") ) == aTmId ){ 
				$(strtdA).removeClass("shaded") ; 
				$(strtdA).addClass("unShade") ; 
			}else{
				$(strtdA).addClass("shaded") ; 				
				$(strtdA).removeClass("unShade") ; 
			}
	});
}

normalTmStrengthsHL = ()=>{
	let tmHtds = $("td[str_h_a], td[str_h_d], td[str_h_o], td[str_a_a], td[str_a_d], td[str_a_o]" ).get() ; 
	$(tmHtds).removeClass("shaded") ; 
	$(tmHtds).removeClass("unShade") ; 
}

// Fixture highligting 
highlightEvent = (fxtrid)=>{
	//	console.log("('highlightEvent", fxtrid ,"$('td[fxtrid=' + fxtrid + ']').length",$('td[fxtrid=' + fxtrid + ']').length) ; 
	$("span.fxtrspan[fxtrid=" + fxtrid + "]").addClass("evHighLite") ;
	// add teamid highligh for DFcontainer (H/A) 
}

shadeNotHL = ()=>{
	removeHLClass("notHL") ; 
	let shadeArr = $("#eventTable td.evtTeamBlock > span.fxtrspan").get() ; 
	console.log("shadeNotHL | shadeArr:", shadeArr.length );
	$.each(
		shadeArr,
		function(i, gm){
			if( $(gm).hasClass("evHighLite") ){
				// console.log("shadeNotHL | fxtr #", gm.fxtrid, " is highlighted.") ; 
			}else{
				$(gm).addClass("notHL") ; 
			}
		}
	) ; 
	setTimeout( ()=>{ removeHLClass("thHiglighted") ; }, 5000 ) ;
	setTimeout( ()=>{ removeHLClass("evHighLite") ; }, 5000 ) ;
	setTimeout( ()=>{ removeHLClass("notHL") ; }, 5000 ) ;
}

unShade 	=  ()=>{ removeHLClass("shaded") ; 		}
unHighlite 	=  ()=>{ removeHLClass("evHighLite") ; 	}
unThHighlite = ()=>{ removeHLClass("thHiglighted"); }

highlightTeamEvents = (tmNm)=>{
	let curEvw = gamesOverview.evWndw
	console.log("highlightTeamEvents:\t", tmNm, "curEvw:", curEvw );
	let tmGmArr = $("#eventTable tr[id='" + tmNm + "'] td.evtTeamBlock.evtp-WSL > span.fxtrspan").get() ; 
	console.log("highlightTeamEvents", tmNm, "tmGmArr size:", tmGmArr.length );
	removeHLClass("thHiglighted") ;
	removeHLClass("evHighLite") ;
	$("#eventTable tr[id="+tmNm+"] th.evntTblTmNmHdr").addClass("thHiglighted") ;
	$.each(
		tmGmArr,
		(index, gm)=>{
			let gmRnd = gm.getAttribute("evrnd") ; 
			let gmId = gm.getAttribute("fxtrid") ; 
			if( ( parseInt(gmRnd) >= curEvw.start ) && ( parseInt(gmRnd) <= curEvw.end ) ){
				console.log("highlightTeamEvents | gmRnd:", gmRnd, "gmId:", gmId ) ;
				$("#eventTable span[fxtrid='" + gmId + "']").addClass("evHighLite") ;
			}
		}
	);
	//shadeNotHL() ; 
}

remBGClasses = ()=>{ 
	for( let c=1; c<WSLTeamsFull.length;c++){
		let clsNm="bg"+WSLTeamsFull[c].shortNm;
		$("." + clsNm ).removeClass(clsNm);}}
/* 

###### section togglers  ######

*/

toggleDFdisplay = ()=>{
	// Toggle first 
	gamesOverview.dfDisplay['containerViz'] = !gamesOverview.dfDisplay['containerViz'] ;
	let dfViz = gamesOverview.dfDisplay['containerViz'] ; 
	gamesOverview.dfDisplay['strengthsViz'] 	= dfViz ;
	gamesOverview.dfDisplay['strengthsVizH'] 	= dfViz ;
	gamesOverview.dfDisplay['strengthsVizA'] 	= dfViz ;
	$("#toggleHAstatsDet").css("backgroundColor", ( gamesOverview.dfDisplay['strengthsViz'] )? "#53ac00":"#d91a00" ) ; 
	toggleDFContainer( gamesOverview.dfDisplay['containerViz'] ) ;
}

toggleDeadline = ()=>{
	gamesOverview.showDdln = !gamesOverview.showDdln ;
	showDeadline( gamesOverview.showDdln ) ; 
	setIndicator("showDdln-idc", ( gamesOverview.showDdln )? "green":"red" ) ; 
	$("#toggleDdln").text( (gamesOverview.showDdln)? "Hide":"Show" ) ; 
}

togglePPdisplay = (viz, f )=>{
	if( viz == 'toggle' ){
		gamesOverview.showPP = !gamesOverview.showPP ;
		// console.log( getCI(), f, "togglePPdisplay", gamesOverview.showPP, viz ) ;
	}else{
		gamesOverview.showPP = Boolean( viz ) ;
		// console.log( getCI(), f, "togglePPdisplay", gamesOverview.showPP, Boolean( viz )  ) ;
	}
	//console.log( getCI(), f, "togglePPdisplay: viz=", viz, " Boolean(viz)=" , Boolean(viz), "gamesOverview.showPP=", gamesOverview.showPP )
	if(  gamesOverview.showPP  ){
		$("#ppOview-cnt").removeClass( "hide-item" ) ;
		$("#ppOview-cnt").addClass( "show-item" ) ;
		$("#ppOview").show(); 
		$("#hdr-tggl-ppnd").css("backgroundColor", "#53AC00" ) ;
		$("#togglePostponed").text( "Hide" ) ;
		showEventClmn(27) ;
		setIndicator("ppsLdd-idc", "green" ) ;
	}else{
		$("#ppOview-cnt").removeClass( "show-item" ) ;
		$("#ppOview-cnt").addClass( "hide-item" ) ;

		$("#ppOview").hide(); 

		$("#hdr-tggl-ppnd").css("backgroundColor", "#D91A00" ) ;
		$("#togglePostponed").text( "Show" ) ;
		hideEventClmn(27) ;
		setIndicator("ppsLdd-idc", "red" ) ;
	}
}

toggleSettings = ()=>{
	gamesOverview.showSttng = !gamesOverview.showSttng ;
	if( gamesOverview.showSttng ){
		$("#indicators").removeClass("hide-item");
		$("#indicators").addClass("show-item");
	}else{
		$("#indicators").removeClass("show-item")
		$("#indicators").addClass("hide-item")
	}
	$("#hdr-tggl-settings").css("backgroundColor",  (gamesOverview.showSttng)? "#53ac00":"#d91a00" );
}

/* 
###### SUB section togglers  ######
*/

toggleDFContainer = (viz)=>{
	/* set container visibilty to 'viz' */
	if( viz ){
		$("#wsl-df-viz").text( "Hide WSL-DF" );
		$("#usr-df-viz").text( "Hide USR-DF" );
		$("#df-tggl").text( "HIDE" );
		$("#teamDF-cnt").removeClass( "hide-item" );
		$("#teamDF-cnt").addClass( "show-item" );
		$("#hdr-tggl-df-fpl").css("backgroundColor", "#53ac00" );
		setIndicator("df-Ldd-idc","green")
	}else{
		$("#wsl-df-viz").text( "Show WSL-DF" );
		$("#usr-df-viz").text( "Show USR-DF" );
		$("#df-tggl").text( "SHOW" );
		$("#teamDF-cnt").removeClass( "show-item" );
		$("#teamDF-cnt").addClass( "hide-item" );
		$("#hdr-tggl-df-fpl").css("backgroundColor", "#d91a00");
		setIndicator("df-Ldd-idc","red")
	}
	toggleStrengthContainer();
}

toggleStrengthContainer = ()=>{
	/* set container visibilty to 'viz' */
	gamesOverview.dfDisplay['strengthsViz'] = !gamesOverview.dfDisplay['strengthsViz'] ;
	let vizC = gamesOverview.dfDisplay['strengthsViz'] ; 
	// console.log("toggleStrengthContainer vizC :" , vizC )
	gamesOverview.dfDisplay['strengthsVizH'] = !vizC ;
	toggleStrengthHome() ; 
	gamesOverview.dfDisplay['strengthsVizA'] = !vizC ;
	toggleStrengthAway() ; 
}

toggleStrengthHome = ()=>{
	// set table rows visibilty to 'viz' 
	// toggle because this can be called by buttons seperately 
	gamesOverview.dfDisplay['strengthsVizH'] =  !gamesOverview.dfDisplay['strengthsVizH'] ;
	if( gamesOverview.dfDisplay['strengthsVizH'] ){
		// console.log("toggleStrengthHome viz=true. " ) ;
		$("#tr_str_h_o").removeClass("df_h_hidden") ;
		$("#tr_str_h_a").removeClass("df_h_hidden") ;
		$("#tr_str_h_d").removeClass("df_h_hidden") ;
		setIndicator("wsl-ha-Ldd-idc", "green") ; 
	}else{
		// console.log("toggleStrengthHome viz=false. " ) ;
		$("#tr_str_h_o").addClass("df_h_hidden") ;
		$("#tr_str_h_a").addClass("df_h_hidden") ;
		$("#tr_str_h_d").addClass("df_h_hidden") ;
		setIndicator("wsl-ha-Ldd-idc", "red") ; 
	}
	$("#df_home button").text( ( gamesOverview.dfDisplay['strengthsVizH'] )? "Fold":"Expand" );
}

toggleStrengthAway = ()=>{
	// set table rows visibilty to 'viz' 
	// toggle because this can be called by buttons seperately 
	gamesOverview.dfDisplay['strengthsVizA'] =  !gamesOverview.dfDisplay['strengthsVizA'] ;
	if( gamesOverview.dfDisplay['strengthsVizA'] ){
		// console.log("toggleStrengthAway viz=true. " ) ;
		$("#tr_str_a_o").removeClass("df_a_hidden") ;
		$("#tr_str_a_a").removeClass("df_a_hidden") ;
		$("#tr_str_a_d").removeClass("df_a_hidden") ;
	}else{
		// console.log("toggleStrengthAway viz=false. " ) ;
		$("#tr_str_a_o").addClass("df_a_hidden") ;
		$("#tr_str_a_a").addClass("df_a_hidden") ;
		$("#tr_str_a_d").addClass("df_a_hidden") ;
	}
	$("#df_away button").text( ( gamesOverview.dfDisplay['strengthsVizA'] )? "Fold":"Expand" );
}

toggleDFuser = ()=>{
	console.log( getCI(), "toggleDFuser gamesOverview.dfSource User: ", gamesOverview.dfSource['user'] );
	if( gamesOverview.dfSource['user'] ){
		// now using FPL DF's, switch to user DF (if stored)
		// console.log( getCI(), "toggleDFuser - now using USER DF " ) ; 
		loadWSLDF() ; 
	}else{
		// console.log( getCI(), "toggleDFuser - now using FPL DF " ) ; 
		loadUserDF() ; 
	}
}

hasCup = (el, evtype)=>{ return $(el).hasClass(evtype) ; } 

showDeadline = (blnSD)=>{	
	let evcps = ["evtp-WSL", "cupMidweek"] ;
	for(let gw=1; gw < 27 ; gw++){
		let hdr = $("#fxtrTblHdr > tr > th[evrnd=" + gw + "]" ).get() ;
		let hdrCupStr 	= "" ;
		let hdrTxtStr 	= [] ;
		let hdrDateStr 	= [] ;

		for( let gwc=0; gwc< $(hdr).length; gwc++ ){
			let fxtrHdr = $(hdr)[gwc] ;
			let evType = $(fxtrHdr).prop("classList") ;
			// console.log( "showDeadline gw: ", gw, " has ", evType[1].split("-")[1], " as class #2. And ", $(fxtrHdr).attr("round"), " as round" ) ;

			$(fxtrHdr).empty() ; 
			hdrTxtStr 	= [	"<span>", $(fxtrHdr).attr("round"),	"</span><br>" ].join("") ;
			hdrDateStr 	= [ "<span>", $(fxtrHdr).attr("date"),	"</span><br>" ].join("") ;
 			hdrCupStr	= [	"<span>", evType[1].split("-")[1], "</span>" ].join("") ;

			let newHdrCup 	= $(hdrCupStr) 	;
			let newHdrTxt 	= $(hdrTxtStr) 	;
			let hdrDate 	= $(hdrDateStr) ;

			$(newHdrTxt).appendTo( $(fxtrHdr) ) ;
			(blnSD)? $(hdrDate).appendTo( $(fxtrHdr) ):" " ;
			$(newHdrCup).appendTo( $(fxtrHdr) ) ;

		} // End For gwc
	} // End For gw
}

toggleReplanned = (i)=>{
	// toggle first. og state is true
	if( i == 0){
		gamesOverview.showRP  = false;
	}else{
		gamesOverview.showRP  = true;
	}

	let bttnArr = $("#ppOviewBttnCnt").children("button").get() ;	
	$("#ppOviewBttnCnt .shaded").removeClass("shaded") ;
	$("#ppOviewBttnCnt .unshaded").removeClass("unshaded") ;
	$("#ppGamesRePlanned").removeClass( "hide-item" ) ;
	$("#ppGamesUnPlanned").removeClass( "hide-item" ) ;
	$("#ppGamesRePlanned").removeClass( "show-item" ) ;
	$("#ppGamesUnPlanned").removeClass( "show-item" ) ;

	if( gamesOverview.showRP ){
		// console.log( getCI(), "toggleReplanned rpIsViz now is" , gamesOverview.showRP ) ;
		$("#ppGamesRePlanned").addClass( "show-item" ) ;
		$("#ppGamesUnPlanned").addClass( "hide-item" ) ;	
		$(bttnArr[0]).addClass("shaded") ;
		$(bttnArr[1]).addClass("unshaded") ;
	}else{
		// console.log( getCI(), "toggleReplanned rpIsViz now is" , gamesOverview.showRP ) ;
		$("#ppGamesUnPlanned").addClass( "show-item" ) ;	
		$("#ppGamesRePlanned").addClass( "hide-item" ) ;
		$(bttnArr[1]).addClass("shaded") ;
		$(bttnArr[0]).addClass("unshaded") ;
	}
}

clspuDF =()=>{ $("#popUpDF").hide() ; }

