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
    }
  });

  var closeEditor = function() {
    $scope.addingItem = false;

    apiService.profile.closeEditor($scope);
  };

  $scope.showEdit = function(item) {
    apiService.profile.showEdit($scope, item);
    // console.warn($scope.currentObject);
  };

  $scope.showAdd = function() {
    $scope.addingItem = true;

    apiService.profile.showAdd($scope, {
      // code: $scope.languageCodes.content[0].accomplishment
    });
  };

  $scope.cancelEdit = function() {
    closeEditor();
  };

  $scope.saveItem = function(item) {
  console.log(item);/*  {
      languageCode: currentObject.data.code,
      isNative: currentObject.data.native,
      isTranslateToNative: currentObject.data.translate,
      isTeachLanguage: currentObject.data.teach,
      speakProf: currentObject.data.speakingProficiency.description,
      readProf: currentObject.data.readingingProficiency.description,
      teachLang: currentObject.data.writingProficiency.description
    }*/
    $scope.isSaving = true;
    // console.log($scope.languageCodes.selectedCode)
    // console.warn(data);
    $scope.errorMessage = 'this is a fake error message hand-crafted at the keyboard using an over-abundance of text characters';
    // closeEditor();
  };

  $scope.deleteItem = function(item) {
    console.warn(item);
    closeEditor();
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
