chatio.controller 'headCtrl', ['$rootScope', '$localStorage', 'socket', ($rootScope, $localStorage, socket) ->

  socket.init()
  $rootScope.$storage = $localStorage.$default(tabs: [])

  $rootScope.showUsername = (user) ->
    res = user.username
    res += ' <img src="/images/signin/vk.png">' if user.vkontakte
    res += ' <img src="images/signin/fb.png">' if user.facebook
    res

]