var token = "efb161ebb5e043e4a52189aade9a9d52"; //sunlight foundation API Token
var polApp = angular.module('polApp', []);

polApp.controller('ctrl', function($scope) {

	$scope.info = {
		zip : "",
		reps : {},
		sen : {},
		per : {}
	};
	$scope.hBills = [];
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
				console.log($scope.info);
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
		console.log('Done Loading');
		$scope.$apply();
		setTimeout(function(){
			$('body').attr('id', 'v2');
			$('#loading').fadeOut(1000);
		},1000);
	};//END dataLoadComplete

	$scope.bringUpDetails = function(id,p){
		var s = (p == 'Rep') ? $scope.info.reps[id] : $scope.info.sen[id];
		$scope.info.per = s;
		console.log(s);
		setTimeout(function(){
			$('body').attr('id', 'v3');
		},500);
	};//END bringUpDetails

	makeApiCall = function(u,cb){
		$.ajax({
			type: 'GET',
			url: u,
			success: function(result){
				cb(result);
			}
		});
	};//END makeApiCall

	$scope.bringUpSponBills = function(){
		$('#loading').fadeIn(500);
		var theId = $scope.info.per.govtrack_id;
		console.log(theId);
		makeApiCall('https://www.govtrack.us/api/v2/bill?sponsor='+theId+'&limit=600',fillSponsoredBills);
	};//END bringUpSponBills

	fillSponsoredBills = function(res){
		console.log(res);
		$scope.hBills = res.objects;
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

$( document ).ready(function(){ $('#zip').focus(); });
