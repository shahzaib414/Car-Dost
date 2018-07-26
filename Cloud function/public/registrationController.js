var app = angular.module('myApp');
app.controller('RegistrationController', function ($scope, $rootScope, $state) {
  $scope.formSubmit = function () {
    
    firebase.database().ref('users/' + $scope.username).set({
        profileURL: $scope.url
      })
      .then(function(){
        window.alert("Saved Data Successfully")
        $scope.url = ""
        $scope.username = ""
      })
      .catch(function (error) {
        window.alert(error)
    });
  };
});