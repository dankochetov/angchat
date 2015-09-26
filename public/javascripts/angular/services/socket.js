chatio.factory('socket', function($rootScope, $q){

	var ready = $q.defer();
	var sock;

	return {
		init: function(){
			var sockInit = $q.defer();
			sock = new SockJS(hostname + '/sockjs');
			sock.onopen = function(){
				ready.resolve();
			}
			sock.onmessage = function(e){
				var data = JSON.parse(e.data);
				$rootScope.$broadcast('socket:' + data.event, data.data);
			}
		},
		emit: function(event, data){
			ready.promise.then(function(){
				sock.send(JSON.stringify({event: event, data: data}));
			});
		}
	}

});