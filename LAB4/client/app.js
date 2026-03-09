(() => {
  const app = angular.module('lab4App', []);

  app.controller('MainCtrl', ['$http', '$scope', function($http, $scope) {
    const vm = this;
    vm.students = [];
    vm.report = {};
    vm.msg = '';

    vm.fetchReportAndStudents = function() {
      $http.get('/api/students').then(r => vm.students = r.data || []).catch(e => vm.msg = e.message || 'Error');
      $http.get('/api/students/report').then(r => vm.report = r.data || {}).catch(e => vm.msg = e.message || 'Error');
    };

    vm.upload = function() {
      vm.msg = '';
      const inp = document.getElementById('csvFile');
      if (!inp || !inp.files || inp.files.length === 0) { vm.msg = 'Please select a CSV file.'; return; }
      const file = inp.files[0];
      const fd = new FormData();
      fd.append('file', file);
      $http.post('/api/students/upload', fd, {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
      }).then(r => {
        vm.msg = 'Upload result: ' + JSON.stringify(r.data);
        vm.fetchReportAndStudents();
        $scope.$applyAsync();
      }).catch(err => vm.msg = (err.data && err.data.message) || err.message || 'Upload failed');
    };

    // init
    vm.fetchReportAndStudents();
  }]);
})();
