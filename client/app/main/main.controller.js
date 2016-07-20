'use strict';

angular.module('poketagramApp')
  .controller('MainController', function ($scope, fileUpload, Auth, $timeout, $http) {
  	$scope.data = {};
    Auth.getCurrentUser((user) => {
    	$scope.currentUser = angular.copy(user);
    	$scope.imageReady = true;
    });

    $('.avatar-input').on('change', () => {
      $timeout(() => {
        $scope.changeAvatar();
      }, 0);
    });

  	$scope.changeAvatar = () => {
      if ($scope.data.newAvatar) {
        fileUpload.uploadFilesToUrl($scope.data.newAvatar, '/api/medias/', (data) => {
          	$scope.currentUser.avatar = data.insertedIds[0];
          	$scope.updateUser({ avatar: $scope.currentUser.avatar });
        });
      }
    };

  	$scope.updateUser = (obj) => {
      $http.put(`/api/users/me`, obj).success(() => {
        Auth.refreshCurrentUser(updated => {
          $scope.currentUser = updated;
        });
      }).error(() => {
        console.log('an error has occurred');
      });
    };
  });
