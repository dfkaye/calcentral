'use strict';

var _ = require('lodash');
var angular = require('angular');

/**
 * Language section controller
 */
angular.module('calcentral.controllers').controller('LanguagesSectionController', function(profileFactory, $scope, $q) {
  var levelMapping = {
    native: 'native',
    teach: 'teacher',
    translate: 'translator'
  };

  var sortLanguageCodes = function(codes) {
    var sortedCodes = codes.sort(function(a, b) {
      return a.descr > b.descr;
    });

    return sortedCodes;
  };

  var fetchLanguageCodes = function() {
    // i like the promise api here...
    return profileFactory.getLanguageCode().then(function(data) {
      var languageCodes = sortLanguageCodes(data.data.feed.accomplishments);
      console.warn('languagesController');
      angular.extend($scope, {
        languageCodes: {
          content: languageCodes
        }
      });
      console.warn($scope.languageCodes.content);
    });
  };

  var openEditor = function() {
    $scope.languages.editorEnabled = true;
  };

  var closeEditor = function() {
    $scope.languages.editorEnabled = false;
  };

  $scope.showEdit = function() {
    if (!$scope.languageCodes) {
      // lazy request codes once
      fetchLanguageCodes().then(openEditor);
    } else {
      openEditor();
    }
  };

  $scope.cancelEdit = function() {
    closeEditor();
  };

  $scope.save = function(data) {
    console.warn(data);
    closeEditor();
  };

  var parseLevels = function(languages) {
    languages = _.map(languages, function(language) {
      if (!language.levels) {
        language.levels = [];
      }
      _.each(levelMapping, function(value, key) {
        if (language[key]) {
          language.levels.push(value);
        }
      });
      return language;
    });
    return languages;
  };

  var parsePerson = function(data) {
    var person = data.data.feed.student;
    var languages = parseLevels(person.languages);
    angular.extend($scope, {
      languages: {
        content: languages,
        supported: true,
        editorEnabled: false
      }
    });
  };

  var getPerson = profileFactory.getPerson().then(parsePerson);

  var loadInformation = function() {
    $q.all(getPerson).then(function() {
      $scope.isLoading = false;
    });
  };

  loadInformation();
});
