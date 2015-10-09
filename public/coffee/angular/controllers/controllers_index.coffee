chatio.controller 'indexCtrl', ['$scope', '$rootScope', '$http', '$route', 'autoLogin', 'template', ($scope, $rootScope, $http, $route, autoLogin, template) ->

  $rootScope.title = ' - Main'

  $http.get('/getuser').then (response) ->
    if response.data != '401'
      template.go '/chat'
      template.clear()

  $scope.fb_login = ->
    $scope.showLoading = true
    FB.login (response) ->
      if response.status == 'connected'
        window.location = '/signin/fb'
      else
        $scope.showLoading = false

  $scope.vk_login = ->
    $scope.showLoading = true
    VK.init apiId: '5062854'
    VK.Auth.getLoginStatus (response) ->
      if !response.session
        VK.Auth.login (response) ->
          if response.session
            window.location = '/signin/vk'
          else
            $scope.showLoading = false
      else
        $scope.showLoading = true
        window.location = '/signin/vk'

  $scope.go = (data) ->
    $scope.showLoading = true
    template.go data
    $scope.showLoading = false

]

chatio.controller 'signinCtrl', ['$scope', '$http', 'autoLogin', 'template', ($scope, $http, autoLogin, template) ->

  $scope.submit = ->
    $scope.showLoading = true
    $http.post('/signin', $scope.formData).then (response) ->
      if response.data != 'success'
        $scope.showLoading = false
        $scope.errors = response.data

  $scope.template = template

]

chatio.controller 'signupCtrl', ['$scope', '$http', 'autoLogin', 'template', ($scope, $http, autoLogin, template) ->

  $scope.submit = ->
    $scope.showLoading = true
    $http.post('/signup', $scope.formData).then (response) ->
      if response.data != 'success'
        $scope.showLoading = false
        $scope.errors = response.data

  $scope.template = template

]