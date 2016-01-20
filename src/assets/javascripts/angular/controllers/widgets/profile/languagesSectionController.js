'use strict';

var _ = require('lodash');
var angular = require('angular');

/**
 * Language section controller
 */
angular.module('calcentral.controllers').controller('LanguagesSectionController', function(apiService, profileFactory, $scope, $q) {
  // model and state
  angular.extend($scope, {
    addingItem: false,
    currentObject: {},
    emptyObject: {},
    errorMessage: '',
    isSaving: false,
    items: {
      content: [],
      editorEnabled: false,
      loaded: false
    },
    languageCodes: {
      content: [],
      loaded: false,
      selectedCode: ''
    },
    proficiencies: [
      {
        name: 'High',
        value: '1'
      },
      {
        name: 'Medium',
        value: '2'
      },
      {
        name: 'Low',
        value: '3'
      }
    ]
  });

  var actionCompleted = function(data) {
    apiService.profile.actionCompleted($scope, data, loadInformation);
  };

  var saveCompleted = function(data) {
    $scope.isSaving = false;
    actionCompleted(data);
  };

  var saveLevel = function(level) {
    return level || '';
  };

  var saveProficiency = function(proficiency) {
    return proficiency && proficiency.description || '';
  };

  $scope.saveItem = function(item) {
    apiService.profile.save($scope, profileFactory.postLanguage, {
      languageCode: item.code,
      isNative: saveLevel(item.native),
      isTranslateToNative: saveLevel(item.translate),
      isTeachLanguage: saveLevel(item.teach),
      speakProf: saveProficiency(item.speakingProficiency),
      readProf: saveProficiency(item.readingProficiency),
      teachLang: saveProficiency(item.writingProficiency)
    }).then(saveCompleted);
  };

  $scope.showEdit = function(item) {
    apiService.profile.showEdit($scope, item);
  };

  $scope.showAdd = function() {
    $scope.addingItem = true;
    apiService.profile.showAdd($scope, {});
  };

  $scope.cancelEdit = function() {
    $scope.addingItem = false;
    $scope.isSaving = false;
    apiService.profile.closeEditor($scope);
  };

  var deleteCompleted = function(data) {
    $scope.isDeleting = false;
    actionCompleted(data);
  };

  $scope.deleteItem = function(item) {
    // WIP console.warn(item);

    // should throw on item.type not defined
    return apiService.profile.delete($scope, profileFactory.deleteLanguage, {
      type: item.type.code
    }).then(deleteCompleted);
  };

  var levelMapping = {
    native: 'native',
    teach: 'teacher',
    translate: 'translator'
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
      items: {
        content: languages,
        loaded: true
      }
    });
    // WIP console.warn(languages);
  };

  var getPerson = profileFactory.getPerson().then(parsePerson);

  var loadInformation = function() {
    $scope.isLoading = true;
    $q.all(getPerson).then(function() {
      $scope.isLoading = false;
    });
  };

  var sortLanguageCodes = function(codes) {
    var sortedCodes = codes.sort(function(a, b) {
      return a.descr > b.descr;
    });
    return sortedCodes;
  };

  var fetchLanguageCodes = function() {
    // i like the promise api here.
    return profileFactory.getLanguageCode().then(function(data) {
      var languageCodes = sortLanguageCodes(data.data.feed.accomplishments);
      angular.extend($scope, {
        languageCodes: {
          content: languageCodes,
          loaded: true,
          selectedCode: ''
        }
      });
      // console.warn($scope.languageCodes.content);
    });
  };

  // call fetch() once, return a promise for loadInformation
  // loadInformation can be called independently for any subsequent refresh
  fetchLanguageCodes().then(loadInformation);
});
