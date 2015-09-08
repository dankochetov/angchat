chatio.controller('roomsCtrl', function($scope, $rootScope, $timeout, $http){

	var socket = $scope.socket = $rootScope.sockets['rooms'];

	$scope.rooms = [];
	$scope.showForm = [];
	$scope.pwd = [];
	$scope.error = [];
	$scope.loading = true;

	socket.emit('get rooms');

	socket.on('rooms', function(data){
		$scope.loading = false;
		$scope.$apply(function(){
			$scope.rooms = data;
			$timeout(function(){
				//Tooltips
				jQuery(function(){
				  jQuery('[data-toggle="tooltip"]').tooltip();
				});
			}, 0);
		});
	});
});