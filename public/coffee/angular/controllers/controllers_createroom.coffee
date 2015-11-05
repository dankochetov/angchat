chatio.controller 'createroomCtrl', ['$scope', '$rootScope', '$http', '$location', 'template', 'autoLogout', 'tabs', ($scope, $rootScope, $http, $location, template, autoLogout, tabs) ->

  if not $rootScope.user?
    template.go '/index'
    template.clear()

  $scope.submit = ->
    $scope.showLoading = true
    $http.post('/chat/createroom', $scope.formData).then (response) ->
      data = $scope.formData
      if response.data.status != 'success'
        $scope.errors = response.data.errors
        $scope.showLoading = false
      else
        newTab = 
          title: data.name
          id: response.data.id
          url: '/chat/room/' + response.data.id
          active: true
          private: false
        tabs.open newTab, ->
          $scope.showLoading = false
          template.go '/chat'

]