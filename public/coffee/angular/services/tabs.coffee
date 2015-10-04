chatio.factory 'tabs', ['$rootScope', '$timeout', '$localStorage', '$q', ($rootScope, $timeout, $localStorage, $q) ->

  flush = ->
    $rootScope.$storage.tabs = $rootScope.tabs
    $rootScope.$storage.tab = $rootScope.tab
    $rootScope.$storage.rootTab = $rootScope.rootTab

  active = (id, callback, params = {}) ->
    tabsInit.promise.then ->
      $timeout ->
        $rootScope.rootTab.active = id == 'root'
        if id == 'root'
          $rootScope.tab = $rootScope.rootTab
        else
          for num of $rootScope.tabs
            $rootScope.tabs[num].active = false if params.force
            if $rootScope.tabs[num].id == id
              $rootScope.tabs[num].active = true
              $rootScope.tab = $rootScope.tabs[num]
              $rootScope.tab.unread = 0
              break if !params.force
        callback() if callback
        flush()

  $rootScope.tab = {}
  $rootScope.rootTab =
    title: 'New tab'
    url: '/chat/rooms'
    active: true
  $rootScope.tabs = []
  tabsInit = $q.defer()

  {
    init: (callback) ->
      $rootScope.tabs = $rootScope.$storage.tabs
      $rootScope.rootTab = $rootScope.$storage.rootTab or $rootScope.rootTab
      $rootScope.tab = $rootScope.$storage.tab or $rootScope.rootTab
      tabsInit.resolve()
      callback() if callback

    open: (data, callback) ->
      $timeout ->
        $rootScope.tabs.push data
        if data.active
          active data.id, callback, force: true

    close: (id, callback) ->
      tabsInit.promise.then ->
        for num of $rootScope.tabs
          if $rootScope.tabs[num].id == id
            res = num
            $timeout ->
              $rootScope.tabs.splice res, 1
              flush()
              callback(res) if callback

    active: active
    addUnread: (id, callback) ->
      tabsInit.promise.then ->
        for i of $rootScope.tabs
          if $rootScope.tabs[i].id == id
            $timeout ->
              ++$rootScope.tabs[i].unread
              callback() if callback
            break

    count: -> $rootScope.tabs.length
  }
]