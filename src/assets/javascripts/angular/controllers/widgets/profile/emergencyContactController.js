'use strict';

var angular = require('angular');
var _ = require('lodash');

/**
 * Emergency Contact controller
 */
angular.module('calcentral.controllers').controller('EmergencyContactController', function(apiService, profileFactory, $scope) {
  angular.extend($scope, {
    countries: [],
    currentObject: {},
    emptyObject: {
      address: {
        countryCode: 'USA',
        houseType: 'HOME'
      },
      phones: [
        {
          type: '',
          number: '',
          extension: ''
        }
      ]
    },
    errorMessage: '',
    isLoading: true,
    isSaving: false,
    items: {
      content: [],
      editorEnabled: false
    },
    states: []
  });

  var getCountries = profileFactory.getCountries;
  var getPerson = profileFactory.getPerson;
  var getTypesAddress = profileFactory.getTypesAddress;
  var getTypesPhone = profileFactory.getTypesPhone;
  var getTypesRelationship = profileFactory.getTypesRelationship;

  var parseCountries = function(data) {
    $scope.countries = _.sortBy(_.filter(_.get(data, 'data.feed.countries'), {
      hasAddressFields: true
    }), 'descr');
  };

  /**
   * Fix the formatted addresseses (if there are any), for the read-only-view,
   * not the edit view.
   */
  var fixFormattedAddresses = function() {
    if (!$scope.items.content) {
      return;
    }

    $scope.items.content = $scope.items.content.map(function(element) {
      var formattedAddress = _.get(element, 'address.formattedAddress');
      if (formattedAddress) {
        element.address.formattedAddress = apiService.profile.fixFormattedAddress(formattedAddress);
      }
      return element;
    });
  };

  /**
   * TODO: resolve POST data vs. GET data mismatch for phone field support. Function applies only the first phone listed for each emergencyContact.
   */
  /*var fixPhones = function() {
    if (!$scope.items.content) {
      return;
    }
    $scope.items.content = $scope.items.content.map(function(element) {
      element.phones = [element.phones[0]];
      return element;
    });
  };*/

  var parsePerson = function(data) {
    apiService.profile.parseSection($scope, data, 'emergencyContacts');
    fixFormattedAddresses();
    // fixPhones();
  };

  var parseTypesAdddress = function(data) {
    $scope.addressTypes = apiService.profile.filterTypes(_.get(data, 'data.feed.addressTypes'), $scope.items);
  };

  var parseTypesPhone = function(data) {
    $scope.phoneTypes = apiService.profile.filterTypes(_.get(data, 'data.feed.xlatvalues.values'), $scope.items);
  };

  /**
   * Sort relationshipTypes array in ascending order by description (text
   * displayed in select element), while pushing options representing "Other
   * Relative" (`R`), and generic "Other" (`O`) type to the end of the sorted
   * array.
   * @return {Array} The sorted array of relationship codes.
   */
  var sortRelationshipTypes = function(types) {
    var RE_RELATIONSHIP_OTHER = /^(O|R)$/;

    return types.sort(function(a, b) {
      var left = a.fieldvalue;
      var right = b.fieldvalue;

      return RE_RELATIONSHIP_OTHER.test(left) ? 1 : RE_RELATIONSHIP_OTHER.test(right) ? -1 : a.xlatlongname > b.xlatlongname;
    });
  };

  var parseTypesRelationship = function(data) {
    var relationshipTypes = apiService.profile.filterTypes(_.get(data, 'data.feed.xlatvalues.values'), $scope.items);

    $scope.relationshipTypes = sortRelationshipTypes(relationshipTypes);
  };

  var parseAddressFields = function(data) {
    $scope.currentObject.addressFields = _.get(data, 'data.feed.labels');
  };

  var parseStates = function(data) {
    $scope.states = _.sortBy(_.get(data, 'data.feed.states'), 'descr');
  };

  var countryWatch = function(countryCode) {
    if (!countryCode) {
      return;
    }

    $scope.currentObject.whileAddressFieldsLoading = true;

    profileFactory.getAddressFields({
      country: countryCode
    })
    .then(parseAddressFields)
    // Get the states for a certain country (if available)
    .then(function() {
      return profileFactory.getStates({
        country: countryCode
      });
    })
    .then(parseStates)
    .then(function() {
      $scope.currentObject.whileAddressFieldsLoading = false;
    });
  };

  var countryWatcher;

  /**
   * We need to watch when the country changes, if so, load the address fields dynamically depending on the country
   */
  var startCountryWatcher = function() {
    countryWatcher = $scope.$watch('currentObject.data.address.countryCode', countryWatch);
  };

  var loadInformation = function(/* options */) {
    $scope.isLoading = true;

    // If we were previously watching a country, we need to remove that
    if (countryWatcher) {
      countryWatcher();
    }

    getPerson({
      refreshCache: true
    })
    .then(parsePerson)
    .then(getCountries)
    .then(parseCountries)
    .then(getTypesAddress)
    .then(parseTypesAdddress)
    .then(getTypesPhone)
    .then(parseTypesPhone)
    .then(getTypesRelationship)
    .then(parseTypesRelationship)
    .then(startCountryWatcher)
    .then(function() {
      $scope.isLoading = false;

      console.log($scope);
    });
  };

  var actionCompleted = function(data) {
    apiService.profile.actionCompleted($scope, data, loadInformation);
  };

  var deleteCompleted = function(data) {
    $scope.isDeleting = false;
    actionCompleted(data);
  };

  var saveCompleted = function(data) {
    $scope.isSaving = false;
    actionCompleted(data);
  };

  $scope.closeEditor = function() {
    apiService.profile.closeEditor($scope);
  };

  $scope.cancelEdit = function() {
    $scope.isSaving = false;
    $scope.closeEditor();
  };

  $scope.deleteItem = function(item) {
    return apiService.profile.delete($scope, profileFactory.deleteEmergencyContact, {
      contactName: item.name
    }).then(deleteCompleted);
  };

  $scope.deletePhone = function(phone) {
    $scope.currentObject.data.phones = $scope.currentObject.data.phones.filter(function(current) {
      return phone !== current;
    });
  };

  var closeEditPhone = function(phone) {
    phone.isEditing = false;
  };

  var showEditPhone = function(phone) {
    console.warn('editing phone');
    phone.isEditing = true;
    console.log(phone);
  };

  $scope.editPhone = function(phone) {
    $scope.currentObject.data.phones.some(function(current, index) {
      // var test = phone === current;
      if (phone === current) {
        showEditPhone({
          index: index,
          phone: phone
        });
      }
      // return test;
    });
  };

  $scope.showAdd = function() {
    apiService.profile.showAdd($scope, $scope.emptyObject);
  };

  $scope.showEdit = function(item) {
    apiService.profile.showEdit($scope, item);
    $scope.currentObject.data.address.countryCode = item.address.countryCode;
    $scope.currentObject.data.address.postal = item.address.postalCode;

    console.warn('now editing');
    console.dir($scope.currentObject);
  };

  /**
   * Merges item data to keys expected as POST endpoint params.
   * @param {Object} The item's form data.
   * @return {Object} The normalized data to POST.
   */
  var normalizeEmergencyContact = function(item) {
    // Ref UX Design: https://jira.berkeley.edu/browse/SISRP-5716
    // Ref Emergency Contact Post API: https://docs.google.com/document/d/1FpnbBb47AptN7RT0BiCb1ApYok_OoUaY9QyEZ8NF6sw
    // Ref JIRA https://jira.berkeley.edu/browse/SISRP-16177

    console.warn('normalizing item info');
    console.dir(item);

    var data = {
      // data model fields that match up
      contactName: item.name,
      relationship: item.relationship.code,
      emailAddr: item.email.emailAddress,
      country: item.address.countryCode,
      address1: item.address.address1,
      address2: item.address.address2,
      address3: item.address.address3,
      address4: item.address.address4,
      num1: item.address.num1,
      num2: item.address.num2,
      addrField1: item.address.addrField1,
      addrField2: item.address.addrField2,
      addrField3: item.address.addrField3,
      county: item.address.county,
      state: item.address.stateCode,
      postal: item.address.postalCode,
      // `preferred` is a boolean (true or false), convert to 'Y' or 'N'
      isPrimaryContact: item.preferred ? 'Y' : 'N', // 'either Y or N'

      /* data model mismatches */
      // API accepts _only one_ phone
      phone: item.phones[0].number,
      extension: item.phones[0].extension,

      // API does _not_ accept 'CELL'
      phoneType: item.phones[0].type,

      addressType: '', // what does this map to?  item.address.houseType ??

      // These are not included in item (an emergency contact)
      geoCode: '', // what does this map to?
      inCityLimit: 'Y', // Y|N boolean ~ what does this map to?
      countryCode: '', // what does this map to?
      isSamePhoneEmpl: 'N', // Y|N boolean
      isSameAddressEmpl: 'N' // Y|N boolean
    };

    console.warn('normalized post data');
    console.dir(data);

    return data;
  };

  $scope.saveItem = function(item) {
    var data = normalizeEmergencyContact(item);

    apiService.profile
      .save($scope, profileFactory.postEmergencyContact, data)
      .then(saveCompleted);
  };

  loadInformation();
});
