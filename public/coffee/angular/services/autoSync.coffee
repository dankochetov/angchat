chatio.factory 'autoLogin', ['$rootScope', '$location', '$route', '$http', 'socket', ($rootScope, $location, $route, $http, socket) ->
  socket.on 'autoLogin', (data) ->
    $http.get('/getuser').then (response) ->
        location.reload() if response.data != '401'
  {}
]

chatio.factory 'autoLogout', ['$rootScope', '$location', '$route', '$http', 'socket', ($rootScope, $location, $route, $http, socket) ->
  socket.on 'autoLogout', (data) ->
    $http.get('/getuser').then (response) ->
        location.reload() if response.data == '401'
  {}
]