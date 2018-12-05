/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import _ = require('lodash');
class NewApiController {

  private enableFileImport: boolean;
  private importFileMode: boolean;
  private importURLMode: boolean;
  private apiDescriptorURL: string;

  constructor(private $scope, private NotificationService, private ApiService) {
    'ngInject';
    this.initImportAPISettings();
  }

  initImportAPISettings() {
    var that = this;
    this.enableFileImport = false;
    this.importURLMode= false;
    this.apiDescriptorURL = null;
    this.$scope.$watch('importAPIFile.content', function (data) {
      if (data) {
        that.enableFileImport = true;
      }
    });
  }

  importAPI() {
    if (this.importFileMode) {
      var extension = this.$scope.importAPIFile.name.split('.').pop();
      switch (extension) {
        case "yml" :
        case "yaml" :
          this.importSwagger();
          break;
        case "json" :
          if (this.isSwaggerDescriptor()) {
            this.importSwagger();
          } else {
            this.importGraviteeIODefinition();
          }
          break;
        default:
          this.enableFileImport = false;
          this.NotificationService.showError("Input file must be a valid API definition file.");
      }
    } else {
      this.importSwagger();
    }
  }

  enableImport() {
    if (this.importFileMode) {
      return this.enableFileImport;
    } else {
      return (this.apiDescriptorURL && this.apiDescriptorURL.length);
    }
  }

  importSwagger() {
    let _this = this;
    let swagger;

    if (this.importFileMode) {
      swagger = {
        version: 'VERSION_2_0',
        type: 'INLINE',
        payload: this.$scope.importAPIFile.content
      }
    } else {
      swagger = {
        type: 'URL',
        payload: this.apiDescriptorURL
      }
    }

    this.ApiService.importSwagger(swagger).then(function (api) {
      var importedAPI = api.data;
      importedAPI.contextPath = importedAPI.name.replace(/\s+/g, '').toLowerCase();
      importedAPI.description = (importedAPI.description) ? importedAPI.description : "Default API description";
      _this.ApiService.create(importedAPI).then(function(api) {
        _this.NotificationService.show('API created');
        _this.$state.go('management.apis.detail.portal.general', {apiId: api.data.id});
      });
    });
  }

  isSwaggerDescriptor() {
    try {
      var fileContent = JSON.parse(this.$scope.importAPIFile.content);
      return fileContent.hasOwnProperty('swagger');
    } catch (e) {
      this.NotificationService.showError("Invalid json file.");
    }
  }

  importGraviteeIODefinition() {
    var _this = this;
    this.ApiService.import(null, this.$scope.importAPIFile.content).then(function (api) {
      _this.NotificationService.show('API created');
      _this.$state.go('management.apis.detail.portal.general', {apiId: api.data.id});
    });
  }
}

export default NewApiController;
