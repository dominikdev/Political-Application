var token = "efb161ebb5e043e4a52189aade9a9d52"; //sunlight foundation API Token
var polApp = angular.module('polApp', []);

polApp.controller('ctrl', function($scope) {

	var sunBillTerms = ["bill_id","chamber","congress","history","introduced_on","last_action_at","last_version","last_version_on","number","official_title","popular_title","short_title","urls"];
	var govBillTerms = ["current_status","id","current_status_description","current_status_label","display_number","number","is_alive","is_current","link","major_actions","terms","thomas_link"];
	$scope.info = {
		zip : "",
		reps : {},
		sen : {},
		per : {}
	};
	$scope.hBills = [];
	$scope.curHBills = {};
	$scope.ftbill = {};
	$scope.resetInfo = function(){
			$scope.info = { zip : "", reps : {}, sen : {}, per : {}};
	};

	$scope.enterZip = function(){
		var z, i = $('#zip');
		z = i.val();
		if(z.length < 5){
			zipFail();
			return false;
		}
		$('#loading').show();
		$scope.resetInfo();
		$scope.info.zip = z;
		$scope.zipApiCall(z);
	};

	$scope.zipApiCall = function(z){
		var theUrl = "https://congress.api.sunlightfoundation.com/legislators/locate?zip="+z+"&apikey="+token;
		$.ajax({
			type: 'GET',
			url: theUrl,
			success: function(result){
				var r = result.results;
				(r.length < 1) ? zipFail() : $scope.processData(r);
			}
		});
	};//END zipApiCall

	$scope.govtrackApiCall = function(i){
		var gUrl = "https://www.govtrack.us/api/v2/role?";
		for(var x = 0; x < i.length; x++){
			gUrl += "&person="+i[x];
		}
		$.ajax({
			type: 'GET',
			url: gUrl,
			success: function(result){
				var r = result.objects;
				for(var x=0; x<r.length;x++){
					var t = r[x].person.id;
						if($scope.info.reps[t])
						{
							if(r[x].current){ $scope.info.reps[t].more_info = r[x];}
							else if($scope.info.reps[t].roles){ $scope.info.reps[t].roles.push(r[x]);}
							else { $scope.info.reps[t].roles = [r[x]];}
						}
						else if($scope.info.sen[t])
						{
							if(r[x].current){ $scope.info.sen[t].more_info = r[x];}
							else if($scope.info.sen[t].roles){ $scope.info.sen[t].roles.push(r[x]);}
							else { $scope.info.sen[t].roles = [r[x]];}
						}
						else
						{
							if ($scope.info.other[t]){ $scope.info.other[t].push(r[x]); }
							else{ $scope.info.other[t] = [r[x]]; }
						}
				}
				
				$scope.dataLoadComplete();
			}
		});
	};//END govtrackApiCall

	$scope.processData = function(d){
		var ids = [];
		for(var i = 0; i < d.length; i++){
			var t = d[i].chamber;
			var id = d[i].govtrack_id;
			ids.push(id);
			switch(t){
				case 'house':
					$scope.info.reps[id] = d[i];
					break;
					case 'senate':
						$scope.info.sen[id] = d[i];
						break;
					}
				}
				$scope.govtrackApiCall(ids);
	};//END processData

	$scope.dataLoadComplete = function(){
		
		$scope.$apply();
		setTimeout(function(){
			$('body').attr('id', 'v2');
			$('#loading').fadeOut(1000);
		},1000);
	};//END dataLoadComplete

	$scope.bringUpDetails = function(id,p){
		var s = (p == 'Rep') ? $scope.info.reps[id] : $scope.info.sen[id];
		$scope.info.per = s;
		
		setTimeout(function(){
			$('body').attr('id', 'v3');
		},500);
	};//END bringUpDetails

	makeApiCall = function(u,cb){
		console.log(u);
		$.ajax({
			type: 'GET',
			url: u,
			success: function(result){
				// console.log(result);
				cb(result);
			}
		});
	};//END makeApiCall
	var gTrackBills = {};
	var sunBills = {};
	$scope.bringUpSponBills = function(){
		$('#loading').fadeIn(500);
	
		var govId = $scope.info.per.govtrack_id;	
		makeApiCall('https://www.govtrack.us/api/v2/bill?sponsor='+govId+'&limit=50&sort=-introduced_date',handleGovTrack);

	};//END bringUpSponBills
	$scope.highlightBill =function(num){
		var bth = $scope.curHBills[num];
		$scope.ftbill = bth;
		makeApiCall(bth.govtrack.link+'/summary', getSummary);
		// makeApiCall('https://www.govtrack.us/api/v2/bill/'+bth.govtrack.id,bringUpHighlightedBill);
		$('body').attr('id', 'v5');
	} //END highlightBill

	$scope.cleanupDate = function(dt){
		var cleaned = dt.split('(')[1].split(',');
		var ndate = new Date(cleaned[0],cleaned[1],cleaned[2]);
		return ndate.toDateString().substr(4);
	} //END cleanupDate
	getSummary = function(res){
		var t = $.parseHTML(res);
		// $scope.ftbill.sunlight.summary =  $(t).find('#libraryofcongress').text();
		var sum =  [];
		$(t).find('#libraryofcongress').children().each(function(){
			sum.push($(this).text());
		});
		// sum =sum.join("<br />");
		console.log(sum);
		$scope.ftbill.summary = sum;
		makeApiCall('https://www.govtrack.us/api/v2/bill/'+$scope.ftbill.govtrack.id,bringUpHighlightedBill);
	}
	bringUpHighlightedBill = function(res){
		$scope.ftbill.moreinfo = res;
		console.log($scope.ftbill);
		$scope.$apply();
	}// END bringUpHighlightedBill
	handleGovTrack= function(res){
		var r = res.objects;
		gTrackBills = {};
		for (var i = 0; i < r.length; i++) {
			var b= r[i];
			var tempBill = {};
			var bNum = b.number;
			for (var x = 0; x < govBillTerms.length; x++) {
				var term = govBillTerms[x]
				tempBill[term] = b[term];
			};
			gTrackBills[bNum] = tempBill
		};
		var bioId = $scope.info.per.bioguide_id;
		makeApiCall("http://congress.api.sunlightfoundation.com/bills?sponsor_id="+bioId+"&per_page=50&order=introduced_on&apikey="+token,handleSunlight);

	}
	handleSunlight= function(res){

		var r = res.results;
		sunBills = {};
		for (var i = 0; i < r.length; i++) {
			var b= r[i];
			var tempBill = {};
			var bNum = b.number;
			for (var x = 0; x < sunBillTerms.length; x++) {
				var term = sunBillTerms[x]
				tempBill[term] = b[term];
			};
			sunBills[bNum] = tempBill
		};
		combineBillData();
	}

	combineBillData = function(){

		var keys = Object.keys(gTrackBills);
		var tempBillArray = [];
		for (var i = 0; i < keys.length; i++) {
			var tbill = {};
			
			tbill.sunlight = sunBills[keys[i]];
			if(tbill.sunlight === undefined || tbill.sunlight['official_title'].length <1) continue;
			
			tbill.govtrack = gTrackBills[keys[i]];
			tempBillArray.push(tbill);
			$scope.curHBills[keys[i]] = tbill;
		};
		
		$scope.hBills = tempBillArray;
		fillSponsoredBills();
	}
	
	fillSponsoredBills = function(){
		
		$scope.$apply();
		setTimeout(function(){
			$('body').attr('id','v4');
			$("#btable").tablesorter();
			$('#loading').fadeOut(500);
		},700);
	};//END fill SponsoredBills

});//END ctrl controller

//Checks That Zip Code Is Valid
zipFail = function(){
	$('#zip').val('').focus().siblings('.zip-er').addClass('active');
	setTimeout(function(){
		$('.zip-er.active').removeClass('active');
	},2000);
}; //END zipFail

//Event Handlers -----------------------------------------------------------

$(document).on('click','#roles h4',function(){
	$('#roles').toggleClass('active');
});

$(document).on('click','.back',function(){
	var nl, loc = $(this).attr('loc');
	switch(loc){
		case "2":
			nl = "v1";
			$('#zip').val('').focus();
			break;
		case "3":
			nl = "v2";
			$('#spot').find('.active').removeClass('active');
			break;
		case "4":
			nl = "v3";
			break;
		case "5":
			nl = "v4";
			break;	
		default:
			nl = "v1";
			$('#zip').val('').focus();
		}
		$('body').attr('id', nl);
});

$(document).on('keydown','#zip',function(e){
	var c, k = [8,37,38,39,40];
	c = e.keyCode;
	if(c == 13) $('#zip-btn').click();
    if($(this).val().length == 5 && k.indexOf(c) == -1){return false; }
});

loglogInfo = function(res){
	//console.log(res);
	var t = $.parseHTML(res);
	// console.log(t);
	console.log($(t).find('#libraryofcongress').text());
	var sum = $(t).find('#libraryofcongress').children().each(function(){
		console.log($(this).text())
	});

}

$( document ).ready(function(){ 
	$('#zip').focus();
	
});
