chatio.controller 'roomCtrl', ['$scope', '$rootScope', '$http', '$timeout', '$location', '$routeParams', '$q', '$modal', 'socket', 'tabs', ($scope, $rootScope, $http, $timeout, $location, $routeParams, $q, $modal, socket, tabs) ->

  listeners = []
  $scope.$on '$destroy', (event, data) ->
    for listener in listeners
      listener()

  $scope.tabInit = $q.defer()
  $scope.usernames = []
  $scope.messages = []
  user = $scope.user = $rootScope.user
  $scope.tabInit.promise.then (tab) ->
    tab.tabInit.promise.then (tab) ->
      init = (room) ->

        showPasswordModal = (callback) ->
          return callback() if !room.protect
          passwordModal = $modal.open
            size: 'sm'
            templateUrl: 'passwordModal'
            controller: 'modalCtrl'
            backdrop: 'static'
            resolve: room: ->
              room

          passwordModal.result.then ((password) ->
            if password != room.password
              showPasswordModal callback
            else 
              callback() if callback
          ), ->
            $rootScope.closeTab tab
   
        room = JSON.parse(room) if typeof room == 'string'
        showPasswordModal ->
          socket.emit 'new user',
            user: $scope.user
            room: room
          $rootScope.title = ' - ' + room.name
          user.rank = $rootScope.user.rank = Math.max(user.rank, if room.users[user._id] then room.users[user._id] else 0)
          tab.unread = 0
          socket.emit 'get history', room._id
          listeners.push socket.on 'history', (data) ->
            return if data.id != tab.id
            $scope.messages = data.data
            $scope.scrollGlue = true
            $timeout (-> $scope.scrollGlue = false), 100

          listeners.push socket.on 'new message', (data) ->
            return if data.room != tab.id
            tabs.addUnread(tab.id) if tab.id != $rootScope.tab.id
            $scope.scrollGlue = true
            $timeout (->
              $scope.messages.push data
              $scope.scrollGlue = false
            ), 100

        $scope.$on 'clear history', (event, id) ->
          $scope.messages = [] if id == room._id

      socket.emit 'get room', tab.id
      close = socket.on 'room', (room) ->
        return if room._id != tab.id
        init room
        close()

]