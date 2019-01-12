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
import SidenavService from './sidenav.service';
import ApiService from '../../services/api.service';
import ApplicationService from '../../services/application.service';
import UserService from '../../services/user.service';
import _ = require('lodash');

export const SubmenuComponent: ng.IComponentOptions = {
  template: require('./submenu.html'),
  bindings: {
    allMenuItems: '<',
    reducedMode: '<'
  },
  require: {
    parent: '^gvSidenav'
  },
  controller: function (SidenavService: SidenavService, $filter: ng.IFilterService, $transitions, $state,
                        ApiService: ApiService, ApplicationService: ApplicationService, UserService: UserService) {
    'ngInject';

    this.sidenavService = SidenavService;

    let that = this;
    $transitions.onSuccess({}, function () {
      that.reload();
    });

    this.$onInit = function () {
      that.reload();
    };

    this.reload = function () {
      if ($state.params.apiId && !UserService.currentUser.userApiPermissions) {
        UserService.currentUser.userApiPermissions = [];
        ApiService.getPermissions($state.params.apiId).then(permissions => {
          _.forEach(_.keys(permissions.data), function (permission) {
            _.forEach(permissions.data[permission], function (right) {
              let permissionName = 'API-' + permission + '-' + right;
              UserService.currentUser.userApiPermissions.push(_.toLower(permissionName));
            });
          });
          reloadPermissionsAndSubmenu();
        });
      } else if ($state.params.applicationId && !UserService.currentUser.userApplicationPermissions) {
        UserService.currentUser.userApplicationPermissions = [];
        ApplicationService.getPermissions($state.params.applicationId).then(permissions => {
          _.forEach(_.keys(permissions.data), function (permission) {
            _.forEach(permissions.data[permission], function (right) {
              let permissionName = 'APPLICATION-' + permission + '-' + right;
              UserService.currentUser.userApplicationPermissions.push(_.toLower(permissionName));
            });
          });
          reloadPermissionsAndSubmenu();
        });
      } else {
        reloadPermissionsAndSubmenu();
      }
    };

    let reloadPermissionsAndSubmenu = function () {
      UserService.reloadPermissions();
      that.submenuItems = $filter<any>('currentSubmenus')(that.allMenuItems);
    };

    this.isActive = function (menuItem) {
      let menuItemSplitted = menuItem.name.split('.');
      let currentStateSplitted = $state.current.name.split('.');
      return menuItemSplitted[0] === currentStateSplitted[0] &&
        menuItemSplitted[1] === currentStateSplitted[1] &&
        menuItemSplitted[2] === currentStateSplitted[2] &&
        menuItemSplitted[3] === currentStateSplitted[3];
    };
  }
};
