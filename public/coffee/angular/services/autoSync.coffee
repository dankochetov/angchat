chatio.factory 'autoLogin', ['$rootScope', '$location', '$route', '$http', 'socket', ($rootScope, $location, $route, $http, socket) ->
  socket.on 'autoLogin', (data) ->
    $http.get('/getuser').then (response) -> if response.data != '401' then window.location = '/'
  {}
]

chatio.factory 'autoLogout', ['$rootScope', '$location', '$route', '$http', 'socket', ($rootScope, $location, $route, $http, socket) ->
  socket.on 'autoLogout', (data) ->
    $http.get('/getuser').then (response) -> if response.data == '401' then window.location = '/'
  {}
]