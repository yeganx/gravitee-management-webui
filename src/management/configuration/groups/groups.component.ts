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
import GroupService from "../../../services/group.service";
import NotificationService from "../../../services/notification.service";
import UserService from "../../../services/user.service";
import { StateService } from '@uirouter/core';

const GroupsComponent: ng.IComponentOptions = {
  bindings: {
    groups: '<'
  },
  template: require("./groups.html"),
  controller: function (
    GroupService: GroupService,
    UserService: UserService,
    NotificationService: NotificationService,
    $mdDialog: angular.material.IDialogService,
    $state: StateService
  ) {
    'ngInject';

    this.$onInit = () => {
      this.initEventRules();
    };

    this.initEventRules = () => {
      this.apiByDefault = {};
      this.applicationByDefault = {};
      _.forEach(this.groups, (group) => {
        this.apiByDefault[group.id] = false;
        this.applicationByDefault[group.id] = false;
        if (group.event_rules) {
          this.apiByDefault[group.id] = _.indexOf(_.map(group.event_rules, "event"), "API_CREATE") >= 0;
          this.applicationByDefault[group.id] = _.indexOf(_.map(group.event_rules, "event"), "APPLICATION_CREATE") >= 0;
        }
      });
    };

    this.showAddGroupModal = () => {
      $mdDialog.show({
        controller: 'DialogAddGroupController',
        controllerAs: 'dialogAddGroupCtrl',
        template: require('./add-group.dialog.html'),
        clickOutsideToClose: true,
        locals: {
          currentName: '',
          currentDefaultApi: false,
          currentDefaultApplication: false,
          action: 'Add'
        }
      }).then( (newGroup) => {
        if (newGroup && newGroup.name) {
          GroupService.create(newGroup).then(() => {
            NotificationService.show('Group ' + newGroup.name + ' has been added.');
            GroupService.list().then( (response) => {
              this.groups = _.filter(response.data, 'manageable');
                this.initEventRules();
              }
            );
          });
        }
      });
    };

    this.showRenameGroupModal = (ev, groupId, name, event_rules) => {
      ev.stopPropagation();
      $mdDialog.show({
        controller: 'DialogAddGroupController',
        controllerAs: 'dialogAddGroupCtrl',
        template: require('./add-group.dialog.html'),
        clickOutsideToClose: true,
        locals: {
          currentName: name,
          currentDefaultApi: this.apiByDefault[groupId],
          currentDefaultApplication: this.applicationByDefault[groupId],
          action: 'Edit'
        }
      }).then( (updatedGroup) => {
        if (updatedGroup && updatedGroup.name) {
          GroupService.update(groupId, updatedGroup).then(() => {
            NotificationService.show('Group ' + updatedGroup.name + ' has been updated.');
            GroupService.list().then( (response) => {
              this.groups = _.filter(response.data, 'manageable');
                this.initEventRules();
              }
            );
          });
        }
      });
    };

    this.removeGroup = (ev, groupId, groupName) => {
      ev.stopPropagation();
      $mdDialog.show({
        controller: 'DialogConfirmController',
        controllerAs: 'ctrl',
        template: require('../../../components/dialog/confirmWarning.dialog.html'),
        clickOutsideToClose: true,
        locals: {
          title: 'Would you like to remove the group "' + groupName + '" ?',
          confirmButton: 'Remove'
        }
      }).then( (response) => {
        if (response) {
          GroupService.remove(groupId).then( () => {
            NotificationService.show('Group ' + groupName + ' has been deleted.');
            GroupService.list().then( (response) => {
                this.groups = _.filter(response.data, 'manageable');
                this.initEventRules();
              }
            );
          });
        }
      });
    };

    this.saveEventRules = (group: any) => {
      if (group.manageable) {
        GroupService.update(group.id, {
          name: group.name,
          defaultApi: this.apiByDefault[group.id],
          defaultApplication: this.applicationByDefault[group.id]
        }).then(() => {
          NotificationService.show('Group ' + group.name + ' has been updated.');
        });
      }
    };

    this.selectGroup = (group: any) => {
      if (group.manageable) {
        $state.go('management.settings.group', {groupId: group.id});
      }
    };
  }
};

export default GroupsComponent;
