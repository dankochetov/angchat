chatio.factory 'autoLogin', ['$rootScope', '$location', '$route', '$http', 'socket', 'template', ($rootScope, $location, $route, $http, socket, template) ->
  socket.on 'autoLogin', (data) ->
    $http.get('/getuser').then (response) ->
    	if response.data != '401'
    		template.setDefault('/chat')
    		template.clear()
    		window.location = '/'
  {}
]

chatio.factory 'autoLogout', ['$rootScope', '$location', '$route', '$http', 'socket', 'template', ($rootScope, $location, $route, $http, socket, template) ->
  socket.on 'autoLogout', (data) ->
    $http.get('/getuser').then (response) ->
    	if response.data == '401'
    		template.setDefault('/index')
    		template.clear()
    		window.location = '/'
  {}
]