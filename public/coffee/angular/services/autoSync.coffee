chatio.factory 'autoLogout', ['$rootScope', '$location', '$route', '$http', 'socket', 'template', ($rootScope, $location, $route, $http, socket, template)->
  socket.on config.events['autoLogout'], (data)->
  		template.setDefault '/index'
  		template.clear()
  		window.location = '/'
  {}
]