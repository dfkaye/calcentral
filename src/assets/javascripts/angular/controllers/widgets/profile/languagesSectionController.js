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
    languageLevels: [
      {
        label: 'Yes',
        value: 'Y'
      },
      {
        label: 'No',
        value: 'N'
      }
    ],
    proficiencyLevels: [
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

  var normalizeLanguageLevel = function(level) {
    // WIP ~ safe defaults to blank string
    // return level && level.match(/[Y,N]/) || '';
    var ok = _.some($scope.languageLevels, function(node) {
      return node.value === level;
    });

    return ok && level || '';
  };

  var normalizeProficiencyDescription = function(proficiency) {
    // WIP ~ safe defaults to blank string
    // return proficiency && proficiency.description.match(/[1,2,3]/) || '';
    var ok = _.some($scope.proficiencyLevels, function(node) {
      return node.value === proficiency.description;
    });

    return ok && proficiency.description || '';
  };

  $scope.saveItem = function(item) {
    apiService.profile.save($scope, profileFactory.postLanguage, {
      languageCode: item.code,
      isNative: normalizeLanguageLevel(item.native),
      isTranslateToNative: normalizeLanguageLevel(item.translate),
      isTeachLanguage: normalizeLanguageLevel(item.teach),
      speakProf: normalizeProficiencyDescription(item.speakingProficiency),
      readProf: normalizeProficiencyDescription(item.readingProficiency),
      teachLang: normalizeProficiencyDescription(item.writingProficiency)
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
    $scope.closeEditor();
    return false;
  };

  $scope.closeEditor = function() {
    apiService.profile.closeEditor($scope);
  };

  var deleteCompleted = function(data) {
    $scope.isDeleting = false;
    actionCompleted(data);
  };

  $scope.deleteItem = function(item) {
    return apiService.profile.delete($scope, profileFactory.deleteLanguage, {
      jpmCatItemId: item.code
    }).then(deleteCompleted);
  };

  var levelMapping = {
    native: 'native',
    teach: 'teacher',
    translate: 'translator'
  };

  var proficiencies = ['speaking', 'reading', 'writing'];

  var parseLevels = function(languages) {
    languages = _.map(languages, function(language) {
      if (!language.levels) {
        language.levels = [];
      }
      _.each(levelMapping, function(value, key) {
        // if (language[key]) {
        // guard against unsafe or unsupported values
        if (normalizeLanguageLevel(language[key])) {
          language.levels.push(value);
        }
      });

      /*
        now guard against unsafe or unsupported proficiency descriptions
      */
      var proficiencyKeys = _.map(proficiencies, function(key) {
        return key + 'Proficiency';
      });

      _.each(proficiencyKeys, function(key) {
        var proficiency = language[key];
        if (proficiency) {
          proficiency.description = normalizeProficiencyDescription(proficiency);
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
    // I like the promise api here!
    return profileFactory.getLanguageCode().then(function(data) {
      var languageCodes = sortLanguageCodes(data.data.feed.accomplishments);
      angular.extend($scope, {
        languageCodes: {
          content: languageCodes,
          loaded: true,
          selectedCode: ''
        }
      });
      // WIP console.warn($scope.languageCodes.content);
    });
  };

  // Using the promise api for fetchLanguageCodes() allows us to loadInformation
  // once, then call loadInformation independently for any subsequent refresh.
  fetchLanguageCodes().then(loadInformation);
});
