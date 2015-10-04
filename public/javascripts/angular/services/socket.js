chatio.factory('socket', function($rootScope, $q){

	var ready = $q.defer();
	var sock;
	var listeners = [];

	return {
		init: function(){
			var sockInit = $q.defer();
			sock = new SockJS(hostname + '/sockjs');
			sock.onopen = function(){
				ready.resolve();
			}
			sock.onmessage = function(e){
				var data = JSON.parse(e.data);
				for (var i in listeners)
				{
					if (i == data.event)
						for (var k in listeners[i]) listeners[i][k].callback(data.data);
				}
			}
		},
		on: function(event, callback){
			if (!listeners[event]) listeners[event] = [];
			var id = (Math.random()*Math.random()).toString();
			listeners[event].push({id: id, callback: callback});
			return function(){
				var c = 0;
				for (var i in listeners[event])
				{
					if (listeners[event][i].id == id)
					{
						listeners[event][i].callback = undefined;
						listeners[event].splice(c, 1);
						break;
					}
					++c;
				} 
			}
		},
		emit: function(event, data){
			ready.promise.then(function(){
				sock.send(JSON.stringify({event: event, data: data}));
			});
		}
	}

});