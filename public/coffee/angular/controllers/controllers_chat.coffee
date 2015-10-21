chatio.controller 'chatCtrl', ['$scope', '$rootScope', '$route', '$routeParams', '$http', '$location', '$timeout', 'socket', 'ngAudio', 'popup', 'autoLogout', 'tabs', 'template', ($scope, $rootScope, $route, $routeParams, $http, $location, $timeout, socket, ngAudio, popup, autoLogout, tabs, template) ->

  listeners = []
  $scope.$on '$destroy', ->
    for listener in listeners
      listener()
      
  userInit = ->
    socket.emit '19', $rootScope.user._id
    listeners.push socket.on '33', (friends) ->
      $scope.loading_friends = false
      $scope.friends = friends
    tabs.init()
    $scope.tabsLoaded = true
    
  $scope.tabs = tabs
  $scope.friends = []
  $scope.loading_friends = true
  $http.get('/getuser').then (response) ->
    if response.data == '401'
      template.go('/index')
      template.clear()
    else
      $rootScope.user = response.data
      userInit()

  listeners.push socket.on '32', (users) ->
    $scope.users = users

  $scope.$on 'rendering finished', ->
    dropdownSlide()

  $scope.addFriend = (id) ->
    for friend of $scope.friends
      if $scope.friends[friend]._id == id
        return alert('This user is already your friend')
    socket.emit '20',
      userid: $rootScope.user._id
      friendid: id

  $scope.removeFriend = (id) ->
    socket.emit '21',
      userid: $rootScope.user._id
      friendid: id

  $rootScope.popups = popup.list
  notifySound = ngAudio.load('../sounds/notify.mp3')
  listeners.push socket.on '10', (data) ->
    if data.to != $rootScope.user._id then return
    if $rootScope.tab.id != data.from
      $scope.openTab data.from,
        private: true
        open: false
        unread: true
    unless $rootScope.active
      popup.add data
      notifySound.play()

  $scope.logout = ->
    $http.get '/logout'

  $scope.openTab = (id, params = {}) ->
    unless params.open? then params.open = true
    createNew = true
    for cur of $rootScope.tabs
      if $rootScope.tabs[cur].id == id
        createNew = false
        break

    if createNew
      if params.private
        socket.emit '22', id
        close = socket.on '23', (user) ->
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
        socket.emit '12', id
        close = socket.on '13', (room) ->
          if room == '404' then return
          newTab = 
            active: params.open or false
            unread: if params.unread then 1 else 0
            title: room.name
            id: id
            url: '/chat/room/' + id
            private: false
            protect: room.protect or false
          tabs.open newTab
          close()
    else
        tabs.addUnread(id) if params.unread
        tabs.active(id) if params.open

  $rootScope.closeTab = (tab) ->
    if !tab.private
      socket.emit '27', tab.id
    count = tabs.count()
    tabs.close tab.id, (pos) ->
      if pos > 0
        tabs.active pos - 1
      else if pos < count - 1
        tabs.active pos + 1
      else
        tabs.active 'root'

  $scope.clearChat = ->
    socket.emit '11', $rootScope.tab.id
    $scope.$broadcast 'clear history', $rootScope.tab.id

]

chatio.controller 'sendMsgCtrl', ['$scope', '$rootScope', 'socket', ($scope, $rootScope, socket) ->

  $scope.submit = (msg) ->
    if $scope.messageForm.$invalid then return
    if $rootScope.tab.private
      socket.emit '8', JSON.stringify
        to: $rootScope.tab.id
        msg: msg
    else
      socket.emit '6', JSON.stringify
        roomid: $rootScope.tab.id
        msg: msg
    $scope.msg = ''

]