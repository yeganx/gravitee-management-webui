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
import * as _ from 'lodash';

import ApplicationService from '../../../../services/application.service';
import NotificationService from '../../../../services/notification.service';
import SidenavService from '../../../../components/sidenav/sidenav.service';
import { StateService } from '@uirouter/core';

interface IApplicationScope extends ng.IScope {
  formApplication: any;
}

class ApplicationGeneralController {

  private application: any;
  private initialApplication: any;

  constructor(
    private ApplicationService: ApplicationService,
    private NotificationService: NotificationService,
    private $state: StateService,
    private $scope: IApplicationScope,
    private $mdDialog: angular.material.IDialogService,
    private SidenavService: SidenavService
  ) {
    'ngInject';
  }

  $onInit() {
    if (!this.application.groups) {
      this.application.groups = [];
    }
    this.initialApplication = _.cloneDeep(this.application);
  }

  update() {
    this.ApplicationService.update(this.application)
      .then(() => {
        this.initialApplication = _.cloneDeep(this.application);
        this.$scope.formApplication.$setPristine();
        this.NotificationService.show(this.application.name + ' has been updated');
        this.SidenavService.setCurrentResource(this.application.name);
      });
  }

  delete() {
    this.ApplicationService.delete(this.application.id)
      .then(() => {
        this.NotificationService.show(this.application.name + ' has been deleted');
        this.$state.go('management.applications.list', {}, {reload: true});
      });
  }

  reset() {
    this.application = _.cloneDeep(this.initialApplication);
    this.$scope.formApplication.$setPristine();
  }

  showDeleteApplicationConfirm(ev) {
    ev.stopPropagation();
    let that = this;
    this.$mdDialog.show({
      controller: 'DialogConfirmController',
      controllerAs: 'ctrl',
      template: require('../../../../components/dialog/confirmWarning.dialog.html'),
      clickOutsideToClose: true,
      locals: {
        msg: '',
        title: 'Would you like to delete your application?',
        confirmButton: 'Remove'
      }
    }).then(function (response) {
      if (response) {
        that.delete();
      }
    });
  }
}

export default ApplicationGeneralController;
