chatio.controller 'roomCtrl', ['$scope', '$rootScope', '$http', '$timeout', '$location', '$routeParams', '$q', '$modal', 'socket', 'tabs', ($scope, $rootScope, $http, $timeout, $location, $routeParams, $q, $modal, socket, tabs) ->

  $scope.listeners = []
  $scope.totalMessages = 0
  $scope.chatWindow = {}
  $scope.$on '$destroy', (event, data) ->
    for listener in $scope.listeners
      listener()
  $scope.tabInit = $q.defer()
  $scope.chatWindowInit = $q.defer()
  $scope.tabShowInit = $q.defer()
  $scope.messages = []
  user = $scope.user = $rootScope.user
  

  $scope.tabActiveInit = (tab) ->
    tab.tabActiveInit.promise.then ->
      $timeout ->
        $scope.chatWindowJQuery = angular.element(".chatWindow-#{tab.id}")
        $scope.tabShowInit.resolve()
        $scope.chatWindow = $scope.chatWindowJQuery[0]
        $scope.scrollGlue = true
      $timeout (-> $scope.scrollGlue = false ), 100

  $scope.tabShowInit.promise.then ->
    $scope.chatWindowJQuery.bind 'scroll', ->
      if $scope.chatWindow.scrollTop is 0 and $scope.messages.length isnt $scope.totalMessages
        $timeout -> $scope.loadHistory(false)

  $scope.tabInit.promise.then (tab) ->
    tab.tabInit.promise.then (tab) ->

      init = (room) ->
        showPasswordModal = (callback) ->
          if not room.protect then return callback()
          passwordModal = $modal.open
            size: 'sm'
            templateUrl: 'passwordModal'
            controller: 'modalCtrl'
            backdrop: 'static'
            resolve: room: -> room

          passwordModal.result.then ((password) ->
            if password isnt room.password
              showPasswordModal callback
            else 
              if callback then callback()
          ), ->
            $rootScope.closeTab tab

        if typeof room is 'string' then room = JSON.parse(room)
        showPasswordModal ->
          socket.emit config.events['new user'],
            user: $scope.user
            room: room
          $rootScope.title = ' - ' + room.name
          user.rank = $rootScope.user.rank = Math.max user.rank, if room.users[user._id]? then room.users[user._id] else 0
          tab.unread = 0

          $scope.listeners.push socket.on config.events['history'], (data) ->
            if data.id isnt tab.id then return

            $scope.tabActiveInit? tab
            delete $scope.tabActiveInit

            $scope.totalMessages = data.data.count
            pos = $scope.chatWindow.scrollHeight - $scope.chatWindow.scrollTop
            for id of data.data.messages
              data.data.messages[id].id = (Math.random() * Math.random()).toString()
            $timeout ->
              $scope.loadingHistory = false
              $scope.messages = data.data.messages.concat $scope.messages
            $timeout -> $scope.chatWindow.scrollTop = $scope.chatWindow.scrollHeight - pos
            $timeout (-> $scope.scrollGlue = false ), 100

          $scope.loadHistory = (scroll = true) ->
            $timeout ->
              $scope.scrollGlue = scroll
              $scope.loadingHistory = true
            socket.emit config.events['get history'],
              roomid: room._id
              skip: $scope.messages.length
          $scope.loadHistory()

          $scope.listeners.push socket.on config.events['new message'], (data) ->
            if data.room isnt tab.id then return
            ++$scope.totalMessages
            tabs.addUnread(tab.id) if tab.id isnt $rootScope.tab.id
            $timeout -> $scope.scrollGlue = true
            $timeout -> $scope.messages.push data
            $timeout (-> $scope.scrollGlue = false), 100

        $scope.$on 'clear history', (event, id) ->
          if id is room._id then $scope.messages = []

      socket.emit config.events['get room'], tab.id
      close = socket.on config.events['room'], (room) ->
        if room._id isnt tab.id then return
        init room
        close()

]