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

import NotificationService from "../../../services/notification.service";
import DocumentationService from "../../../services/documentation.service";
import {StateService} from "@uirouter/core";
import {IScope} from "angular";
import _ = require('lodash');

interface IPageScope extends IScope {
  getContentMode: string;
  fetcherJsonSchema: string;
  rename: boolean;
  editorReadonly: boolean;
}
const EditPageComponent: ng.IComponentOptions = {
  bindings: {
    resolvedPage: '<',
    resolvedGroups: '<',
    resolvedFetchers: '<'
  },
  template: require('./edit-page.html'),
  controller: function (
    NotificationService: NotificationService,
    DocumentationService: DocumentationService,
    $state: StateService,
    $scope: IPageScope
  ) {
    'ngInject';
    this.apiId = $state.params.apiId;


    $scope.rename = false;

    this.$onInit = () => {
      this.page = this.resolvedPage;
      this.groups = this.resolvedGroups;
      this.fetchers = this.resolvedFetchers;
      if( DocumentationService.supportedTypes().indexOf(this.page.type) < 0) {
        $state.go("management.settings.documentation");
      }

      this.emptyFetcher = {
        "type": "object",
        "id": "empty",
        "properties": {"" : {}}
      };
      $scope.fetcherJsonSchema = this.emptyFetcher;
      this.fetcherJsonSchemaForm = ["*"];
      this.initEditor();


      this.codeMirrorOptions = {
        lineWrapping: true,
        lineNumbers: true,
        allowDropFileTypes: true,
        autoCloseTags: true,
        readOnly: $scope.editorReadonly,
        mode: "javascript",
      };

      if (this.page['excluded_groups']) {
        this.page.authorizedGroups = _.difference(_.map(this.groups, 'id'), this.page['excluded_groups']);
      } else {
        this.page.authorizedGroups = _.map(this.groups, 'id');
      }

    };

    this.initEditor = () => {
      $scope.editorReadonly = false;
      if(!(_.isNil(this.page.source) || _.isNil(this.page.source.type))) {
        _.forEach(this.fetchers, fetcher => {
          if (fetcher.id === this.page.source.type) {
            $scope.fetcherJsonSchema = JSON.parse(fetcher.schema);
            $scope.editorReadonly = true;
          }
        });
      }
    };

    this.configureFetcher = (fetcher) => {
      if (! this.page.source) {
        this.page.source = {};
      }

      this.page.source = {
        type: fetcher.id,
        configuration: {}
      };
      $scope.fetcherJsonSchema = JSON.parse(fetcher.schema);
    };

    this.removeFetcher = () => {
      this.page.source = null;
    };

    this.save = () => {

      // Convert authorized groups to excludedGroups
      this.page.excluded_groups = [];
      if (this.groups) {
        this.page.excluded_groups = _.difference(_.map(this.groups, 'id'), this.page.authorizedGroups);
      }

      DocumentationService.update(this.page, this.apiId)
        .then( (response) => {
          NotificationService.show("'" + this.page.name + "' has been updated");
          if (this.apiId) {
            $state.go("management.apis.detail.portal.editdocumentation", {pageId: this.page.id}, {reload: true});
          } else {
            $state.go("management.settings.editdocumentation", {pageId: this.page.id}, {reload: true});
          }
      });
    };

    this.changeContentMode = (newMode) => {
      if ("fetcher" === newMode) {
        this.page.source = {
          configuration: {}
        };
      } else {
        delete this.page.source;
      }
    };

    this.cancel = () => {
      if (this.apiId) {
        $state.go("management.apis.detail.portal.documentation", {apiId: this.apiId, parent: this.page.parentId});
      } else {
        $state.go("management.settings.documentation", {parent: this.page.parentId});
      }
    };

    this.reset = () => {
      if (this.apiId) {
        $state.go("management.apis.detail.portal.editdocumentation", {pageId: this.page.id}, {reload: true});
      } else {
        $state.go("management.settings.editdocumentation", {pageId: this.page.id}, {reload: true});
      }
    };

    this.toggleRename = () => {
      $scope.rename = !$scope.rename;
      if ($scope.rename) {
        this.newName = this.page.name;
      }
    };

    this.rename = () => {
      DocumentationService.partialUpdate("name", this.newName, this.page.id, this.apiId).then( (response) => {
        NotificationService.show("'" + this.page.name + "' has been renamed to '" + this.newName + "'");
        this.page.name = this.newName;
        this.toggleRename();
      });
    };
  }
};

export default EditPageComponent;
