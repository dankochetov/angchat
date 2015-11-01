chatio.controller 'roomsCtrl', ['$scope', '$route', '$rootScope', '$timeout', '$http', 'socket', ($scope, $route, $rootScope, $timeout, $http, socket) ->

  listeners = []
  $scope.$on '$destroy', ->
    for listener in listeners
      listener()

  $scope.rooms = []
  $scope.users = []
  $scope.loading = true
  listeners.push socket.on config.events['rooms'], (data) ->
    $scope.loading = false
    $scope.rooms = data

  socket.emit config.events['get rooms']
  $scope.$on 'rendering finished', (event, data) ->
    #Tooltips
    jQuery('[data-toggle="tooltip"]').tooltip()

  $scope.getUser = (id) ->
    socket.emit config.events['get user'], id
    close = socket.on config.events['user'], (user) ->
      return if user._id != id
      $scope.users[user._id] = user
      close()

]