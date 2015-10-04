chatio.controller 'chatCtrl', ['$scope', '$rootScope', '$route', '$routeParams', '$http', '$location', '$timeout', 'socket', 'ngAudio', 'popup', 'autoLogout', 'tabs', ($scope, $rootScope, $route, $routeParams, $http, $location, $timeout, socket, ngAudio, popup, autoLogout, tabs) ->
  listeners = []

  userInit = ->
    socket.emit 'get friends', $rootScope.user._id
    listeners.push socket.on 'friends', (friends) ->
      $scope.loading_friends = false
      $scope.friends = friends

    tabs.init()
    $scope.tabsLoaded = true

  $scope.$on '$destroy', (event, data) ->
    for listener in listeners
      listener()

  $scope.tabs = tabs
  $scope.friends = []
  $scope.loading_friends = true
  $http.get('/getuser').then (response) ->
    $rootScope.user = response.data
    userInit()

  listeners.push socket.on 'users', (users) ->
    $scope.users = users

  $scope.$on 'rendering finished', ->
    dropdownSlide()

  $scope.addFriend = (id) ->
    for friend of $scope.friends
      if $scope.friends[friend]._id == id
        return alert('This user is already your friend')
    socket.emit 'add friend',
      userid: $rootScope.user._id
      friendid: id

  $scope.removeFriend = (id) ->
    socket.emit 'remove friend',
      userid: $rootScope.user._id
      friendid: id

  $rootScope.popups = popup.list
  notifySound = ngAudio.load('../sounds/notify.mp3')
  listeners.push socket.on 'listener event', (data) ->
    if data.to != $rootScope.user._id or $rootScope.tab.id == data.from then return
    $scope.openTab data.from,
      private: true
      open: false
      unread: true
    popup.add data
    notifySound.play()

  $scope.logout = ->
    $http.get '/logout'

  $scope.openTab = (id, params = {}) ->
    if !params.open? then params.open = true
    createNew = true
    for cur of $rootScope.tabs
      if $rootScope.tabs[cur].id == id
        createNew = false
        break

    if createNew
      if params.private
        socket.emit 'get user', id
        close = socket.on 'user', (user) ->
          if user == '404' or id != user._id then return 
          newTab = 
            active: params.open or false
            unread: if params.unread then 1 else 0
            title: user.username
            id: id
            url: '/chat/user/' + id
            private: true
          tabs.open newTab
          close()
      else
        socket.emit 'get room', id
        close = socket.on 'room', (room) ->
          if room == '404' then return 
          newTab = 
            active: params.open or false
            unread: if params.unread then 1 else 0
            title: room.name
            id: id
            url: '/chat/room/' + id
            private: false
          tabs.open newTab
          close()
    else
        tabs.addUnread(id) if params.unread
        tabs.active(id) if params.open

  $rootScope.closeTab = (tab) ->
    if !tab.private
      socket.emit 'leave room', tab.id
    count = tabs.count()
    tabs.close tab.id, (pos) ->
      if pos > 0
        tabs.active pos - 1
      else if pos < count - 1
        tabs.active pos + 1
      else
        tabs.active 'root'

  $scope.clearChat = ->
    socket.emit 'clear history', $rootScope.tab.id
    $scope.$broadcast 'clear history', $rootScope.tab.id

]

chatio.controller 'sendMsgCtrl', ['$scope', '$rootScope', 'socket', ($scope, $rootScope, socket) ->

  $scope.submit = (msg) ->
    if $scope.messageForm.$invalid then return
    if $rootScope.tab.private
      socket.emit 'send private message', JSON.stringify
        to: $rootScope.tab.id
        msg: msg
    else
      socket.emit 'send message', JSON.stringify
        roomid: $rootScope.tab.id
        msg: msg
    $scope.msg = ''

]