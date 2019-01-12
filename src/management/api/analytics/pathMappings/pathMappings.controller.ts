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

import NotificationService from '../../../../services/notification.service';
import ApiService from '../../../../services/api.service';
import DialogAddPathMappingController from "./modal/add-pathMapping.dialog.controller";
import DialogImportPathMappingController from "./modal/import-pathMapping.dialog.controller";
import DocumentationService from "../../../../services/apiDocumentation.service";

class ApiPathMappingsController {
  private api: any;
  private swaggerDocs: any;

  constructor(
    private ApiService: ApiService,
    private resolvedApi,
    private $mdSidenav: angular.material.ISidenavService,
    private $mdEditDialog,
    private $mdDialog: angular.material.IDialogService,
    private NotificationService: NotificationService,
    private $scope,
    private $rootScope,
    DocumentationService: DocumentationService
  ) {
    'ngInject';
    this.api = this.$scope.$parent.apiCtrl.api;
    this.api.path_mappings = _.sortBy(this.api.path_mappings);
    DocumentationService.list(this.api.id).then((response) => {
      this.swaggerDocs = _.filter(response.data, {type: 'swagger'});
    });

    this.$scope.$on('apiChangeSuccess', (event, args) => {
      this.api = args.api;
    });
  }

  update() {
    this.ApiService.update(this.api).then((updatedApi) => {
      this.onSave(updatedApi);
    });
  }

  showSavePathMappingDialog(index) {
    this.$mdDialog.show({
      controller: DialogAddPathMappingController,
      controllerAs: '$ctrl',
      template: require('./modal/add-pathMapping.dialog.html'),
      clickOutsideToClose: true,
      locals: {
        pathMapping: this.api.path_mappings[index]
      }
    }).then((pathMapping) => {
      if (pathMapping && !_.includes(this.api.path_mappings, pathMapping)) {
        let pathMappingIndex = index === undefined ? this.api.path_mappings.length : index;
        this.api.path_mappings[pathMappingIndex] = pathMapping;
        this.update();
      }
    }, function () {
      // Cancel of the dialog
    });
  }

  showImportPathMappingDialog(index) {
    this.$mdDialog.show({
      controller: DialogImportPathMappingController,
      controllerAs: '$ctrl',
      template: require('./modal/import-pathMapping.dialog.html'),
      clickOutsideToClose: true,
      locals: {
        docs: this.swaggerDocs
      }
    }).then((selectedDoc) => {
      if (selectedDoc) {
        this.ApiService.importPathMappings(this.api.id, selectedDoc).then((updatedApi) => {
          this.onSave(updatedApi);
        })
      }
    }, function () {
      // Cancel of the dialog
    });
  }

  private onSave(updatedApi) {
    this.api = updatedApi.data;
    this.api.path_mappings = _.sortBy(this.api.path_mappings);
    this.api.etag = updatedApi.headers('etag');
    this.$rootScope.$broadcast('apiChangeSuccess', {api: this.api});
    this.NotificationService.show('API \'' + this.$scope.$parent.apiCtrl.api.name + '\' saved');
  }

  delete(index) {
    this.$mdDialog.show({
      controller: 'DialogConfirmController',
      controllerAs: 'ctrl',
      template: require('../../../../components/dialog/confirmWarning.dialog.html'),
      clickOutsideToClose: true,
      locals: {
        title: 'Are you sure you want to remove mapping path [' + this.api.path_mappings[index] + '] ?',
        msg: '',
        confirmButton: 'Remove'
      }
    }).then((response) => {
      if (response) {
        this.api.path_mappings.splice(index, 1);
        this.update();
      }
    });
  }
}

export default ApiPathMappingsController;
