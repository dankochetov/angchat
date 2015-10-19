chatio.factory 'tabs', ['$rootScope', '$timeout', '$localStorage', '$q', ($rootScope, $timeout, $localStorage, $q) ->

  flush = ->
    $rootScope.$storage.tabs = $rootScope.tabs
    $rootScope.$storage.tab = $rootScope.tab
    $rootScope.$storage.rootTab = $rootScope.rootTab

  active = (id, callback, params = {}) ->
    tabsInit.promise.then ->
      $timeout ->
        if id == 'root'
          $rootScope.rootTab.active = true
          $rootScope.tab = $rootScope.rootTab
          $rootScope.title = ' - ' + $rootScope.rootTab.title
        else
          for tab, num in $rootScope.tabs
            if params.force then $rootScope.tabs[num].active = false
            if $rootScope.tabs[num].id == id
              tab.tabInit.resolve tab
              tab.tabActiveInit?.resolve()
              $rootScope.title = ' - ' + $rootScope.tabs[num].title
              $rootScope.tabs[num].active = true
              $rootScope.tab = $rootScope.tabs[num]
              $rootScope.tab.unread = 0
              if !params.force then break
        callback?()
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
      for tab in $rootScope.tabs
        tab.tabInit = $q.defer()
        tab.tabActiveInit = $q.defer()
        if !tab.protect then tab.tabInit.resolve tab
      $rootScope.rootTab = $rootScope.$storage.rootTab or $rootScope.rootTab
      $rootScope.tab = $rootScope.$storage.tab or $rootScope.rootTab
      tabsInit.resolve()
      active $rootScope.tab.id
      callback?()

    open: (data, callback) ->
      for tab in $rootScope.tabs
        if tab.id == data.id then return
      $timeout ->
        data.tabInit = $q.defer()
        data.tabActiveInit = $q.defer()
        $rootScope.tabs.push data
        if data.active then active data.id, callback, force: true

    close: (id, callback) ->
      tabsInit.promise.then ->
        for num of $rootScope.tabs
          if $rootScope.tabs[num].id is id
            res = num
            $timeout ->
              $rootScope.tabs.splice res, 1
              flush()
              callback? res

    active: active
    addUnread: (id, callback) ->
      tabsInit.promise.then ->
        for i of $rootScope.tabs
          if $rootScope.tabs[i].id is id
            $timeout ->
              ++$rootScope.tabs[i].unread
              callback?()
            break

    count: -> $rootScope.tabs.length
  }
]