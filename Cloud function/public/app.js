(function () {
    var app = angular.module('myApp', ['ui.router', 'ngIdle']);
    app.run(function ($rootScope, $location, $state) {
            $state.transitionTo('registration')
    });
    app.config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('registration', {
                    url: '/registration',
                    templateUrl: 'registration.html',
                    controller: 'RegistrationController'
                })
            $urlRouterProvider.otherwise('/');
        }])
})();