'use strict';

angular.module('poketagramApp')
  .service('fileUpload', ['$http', function ($http) {
    this.uploadFilesToUrl = function(files, uploadUrl, successCb, errorCb) {
      var fd = new FormData();
      var len = files.length;
      for (var i = 0; i < len; i++) {
        fd.append('files', files[i]);
      }
      $http.post(uploadUrl, fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined }
      })
      .success(function(data){
        successCb(data);
      })
      .error(function(data){
        errorCb(data);
      });
    };
  }]);
