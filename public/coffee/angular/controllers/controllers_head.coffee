chatio.controller 'headCtrl', ['$scope', '$rootScope', '$localStorage', '$http', 'socket', 'tabs', ($scope, $rootScope, $localStorage, $http, socket, tabs) ->

	listeners = []
	$scope.$on '$destroy', ->
		for listener in listeners
			listener()

	socket.init()
	$rootScope.$storage = $localStorage.$default(tabs: [])

	$rootScope.user = user

	$rootScope.showUsername = (user) ->
		res = user.username
		if user.vkontakte then res += ' <img src="/images/signin/vk.png">'
		if user.facebook then res += ' <img src="images/signin/fb.png">'
		res

	listeners.push socket.on config.events['kick'], (roomid) ->
		count = tabs.count()
		tabs.close roomid, (pos) ->
			if pos > 0
				tabs.active pos - 1
			else if pos < count - 1
				tabs.active pos + 1
			else
				tabs.active 'root'

]