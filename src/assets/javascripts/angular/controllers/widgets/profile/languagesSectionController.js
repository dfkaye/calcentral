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
      loaded: false
    },
    languageLevels: [
      {
        label: 'Yes',
        postValue: 'Y',
        value: true
      },
      {
        label: 'No',
        postValue: 'N',
        value: false
      }
    ],
    proficiencyLevels: [
      {
        label: 'High',
        value: '3'
      },
      {
        label: 'Moderate',
        value: '2'
      },
      {
        label: 'Low',
        value: '1'
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
    // WIP ~ safe defaults to 'Y' or 'N'
    var index = (level) ? 0 : 1;
    return $scope.languageLevels[index].postValue;
  };

  var normalizeProficiencyCode = function(proficiency) {
    // WIP ~ safe defaults to blank string
    // return proficiency && proficiency.code.match(/[1,2,3]/) || '';
    var ok = false;
    // guard against null/undefined proficiency object
    // editor warns about != but it's justified here
    if (proficiency != null && 'code' in proficiency) {
      ok = _.some($scope.proficiencyLevels, function(node) {
        return node.value === proficiency.code;
      });
    }
    return ok && proficiency.code || '';
  };

  $scope.saveItem = function(item) {
    apiService.profile.save($scope, profileFactory.postLanguage, {
      languageCode: item.code,
      isNative: normalizeLanguageLevel(item.native),
      isTranslateToNative: normalizeLanguageLevel(item.translate),
      isTeachLanguage: normalizeLanguageLevel(item.teach),
      speakProf: normalizeProficiencyCode(item.speakingProficiency),
      readProf: normalizeProficiencyCode(item.readingProficiency),
      teachLang: normalizeProficiencyCode(item.writingProficiency)
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
  var proficiencyKeys = _.map(proficiencies, function(key) {
    return key + 'Proficiency';
  });

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
      // guard against unsafe or unsupported proficiency code
      _.each(proficiencyKeys, function(key) {
        var proficiency = language[key];
        if (proficiency) {
          proficiency.code = normalizeProficiencyCode(proficiency);
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

  var loadInformation = function(options) {
    var getPerson = profileFactory.getPerson({
      refreshCache: _.get(options, 'refresh')
    }).then(parsePerson);

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
          loaded: true
        }
      });
      // WIP console.warn($scope.languageCodes.content);
    });
  };

  // Using the promise api for fetchLanguageCodes() allows us to loadInformation
  // once, then call loadInformation independently for any subsequent refresh.
  fetchLanguageCodes().then(loadInformation);
});
