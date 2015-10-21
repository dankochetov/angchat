chatio.controller 'headCtrl', ['$scope', '$rootScope', '$localStorage', '$http', 'socket', 'tabs', ($scope, $rootScope, $localStorage, $http, socket, tabs) ->

	listeners = []
	$scope.$on '$destroy', ->
		for listener in listeners
			listener()

	socket.init()
	$rootScope.$storage = $localStorage.$default(tabs: [])

	$http.get('/getuser').then (response) -> if response != '401' then $rootScope.user = response.data

	$rootScope.showUsername = (user) ->
		res = user.username
		res += ' <img src="/images/signin/vk.png">' if user.vkontakte
		res += ' <img src="images/signin/fb.png">' if user.facebook
		res

	listeners.push socket.on '17', (roomid) ->
		count = tabs.count()
		tabs.close roomid, (pos) ->
			if pos > 0
				tabs.active pos - 1
			else if pos < count - 1
				tabs.active pos + 1
			else
				tabs.active 'root'

]