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

class PageController {
  private page: any;

  private folderName: string;
  private folderMap;
  private folderEntries = [];
  private emptyFetcher: {
    type: string;
    id: string;
    properties: any;
  };
  private useFetcher: boolean;
  private fetchers: any;
  private createMode: boolean;
  private initialPage: any;
  private editMode: boolean;
  private codeMirrorOptions: any;
  private groups: any;

	constructor(
	  private DocumentationService,
    private $state,
    private $mdDialog,
    private $rootScope,
    private $scope,
    private NotificationService,
    private FetcherService,
    private $mdSidenav,
    private resolvedGroups,
    private resolvedApi) {
    'ngInject';
    this.useFetcher = false;

    if (resolvedApi.data.visibility === "private") {
      if (resolvedApi.data.groups) {
        const apiGroupIds = resolvedApi.data.groups;
        this.groups = _.filter(resolvedGroups, (group) => {
          return apiGroupIds.indexOf(group["id"]) > -1;
        });
      } else {
        this.groups = [];
      }
    } else {
      this.groups = resolvedGroups;
    }
    this.codeMirrorOptions = {
      lineWrapping: true,
      lineNumbers: true,
      allowDropFileTypes: true,
      autoCloseTags: true,
      mode: "javascript"
    };

    this.$scope.pageContentFile = {};
    this.$scope.$watch('pageContentFile.content', (data) => {
      if (data) {
        this.page.content = data;
      }
    });

    this.emptyFetcher = {
      "type": "object",
      "id": "empty",
      "properties": {"" : {}}
    };

    this.$scope.fetcherJsonSchema = this.emptyFetcher;
    this.$scope.fetcherJsonSchemaForm = ["*"];
    FetcherService.list().then(response => {
      this.fetchers = response.data;
      if ( $state.current.name === 'management.apis.detail.portal.documentation.new' ) {
        if (['SWAGGER', 'MARKDOWN', 'FOLDER'].indexOf($state.params.type) === -1) {
          $state.go('apis.admin.documentation');
        }
        this.createMode = true;
        this.page = { type: this.$state.params.type };
        this.initialPage = _.clone(this.page);
        this.edit();

        this.loadFolders();
      } else {
        this.preview();
        DocumentationService.get($state.params.apiId, $state.params.pageId).then( response => {
          this.page = response.data;
          this.initialPage = _.clone(response.data);
          if (this.page.excluded_groups) {
            this.page.authorizedGroups = _.difference(_.map(this.groups, "id"), this.page.excluded_groups);
          } else {
            this.page.authorizedGroups = _.map(this.groups, "id");
          }
          if(!(_.isNil(this.page.source) || _.isNil(this.page.source.type))) {
            this.useFetcher = true;
            _.forEach(this.fetchers, fetcher => {
              if (fetcher.id === this.page.source.type) {
                this.$scope.fetcherJsonSchema = JSON.parse(fetcher.schema);
              }
            });
          }
        }).then( () => {
          this.loadFolders();
        });
      }
    });
  }

  loadFolders() {
    this.DocumentationService.getFolderPromise().then(
      (folderMap: Map<string, string>) => {
        this.folderName = folderMap.get(this.page.parentId);
        this.folderMap = folderMap;

        this.folderEntries = [];
        folderMap.forEach((value, key, map) => {
          this.folderEntries.push({id: key, name: value});
        });
      }
    );
  }

  toggleUseFetcher() {
    this.$scope.fetcherJsonSchema = this.emptyFetcher;
    this.page.source = {};
  }

  configureFetcher(fetcher) {
    if (! this.page.source) {
      this.page.source = {};
    }

    this.page.source = {
      type: fetcher.id,
      configuration: {}
    };
    this.$scope.fetcherJsonSchema = JSON.parse(fetcher.schema);
  }

  upsert() {
    if ( !this.useFetcher && this.page.source ) {
      delete this.page.source;
    }
    if(this.createMode) {
      this.DocumentationService.createPage(this.$state.params.apiId, this.page)
        .then((page) => {
          this.onPageUpdate();
          this.$state.go('management.apis.detail.portal.documentation.page', {apiId: this.$state.params.apiId,pageId: page.data.id}, {reload: true});
        })
        .catch((error) => {
          this.$scope.error = error;
      });
    } else {
      // convert authorized groups to excludedGroups
      this.page.excludedGroups = [];
      if (this.groups) {
        this.page.excludedGroups = _.difference(_.map(this.groups, "id"), this.page.authorizedGroups);
      }
      this.DocumentationService.editPage(this.$state.params.apiId, this.page.id, this.page)
        .then(() =>{
          this.onPageUpdate();
          this.$state.go(this.$state.current, this.$state.params, {reload: true});
        })
        .catch(error =>{
          this.$scope.error = error;
        });
    }
  }

  reset() {
    this.preview();
    if (this.initialPage) {
      this.page = _.clone(this.initialPage);
    }
    if (this.$state.params.fallbackPageId) {
      this.$state.go("management.apis.detail.portal.documentation.page", {pageId: this.$state.params.fallbackPageId});
    } else {
      this.$state.go("management.apis.detail.portal.documentation");
    }
  }

  remove() {
    let that = this;
    this.$mdDialog.show({
      controller: 'DialogConfirmController',
      controllerAs: 'ctrl',
      template: require('../../../../../../components/dialog/confirmWarning.dialog.html'),
      clickOutsideToClose: true,
      locals: {
        title: 'Are you sure you want to remove the page "' + this.page.name + '" ?',
        msg: '',
        confirmButton: 'Remove'
      }
    }).then(function (response) {
      if (response) {
        that.DocumentationService.deletePage(that.$scope.$parent.apiCtrl.api.id, that.page.id).then(function () {
          that.preview();
          that.$rootScope.$broadcast('onGraviteePageDeleted');
        });
      }
    });
  }

  edit() {
    if (this.page.type === 'MARKDOWN') {
      this.codeMirrorOptions.mode = 'gfm';
    } else if (this.page.type === 'SWAGGER') {
      this.codeMirrorOptions.mode = 'javascript';
    }
    this.editMode = true;
    this.$scope.$parent.listPagesDisplayed = false;
    if(this.page.source) {
      this.useFetcher = true;
      _.forEach(this.fetchers, (fetcher) => {
        if(fetcher.id === this.page.source.type) {
          this.$scope.fetcherJsonSchema = JSON.parse(fetcher.schema);
        }
      });
    }
  }

  toggleHomepage(){
      this.page.homepage = !this.page.homepage;
      this.upsert();
  }

  showSettings() {
    this.$mdSidenav('page-settings').toggle();
  }

  preview() {
    this.editMode = false;
    this.$scope.$parent.listPagesDisplayed = true;
  }

  changePublication() {
    let editPage = _.clone(this.initialPage);
    editPage.published = this.page.published;
    let that = this;
    this.DocumentationService.editPage(this.$scope.$parent.apiCtrl.api.id, this.page.id, editPage).then(function () {
      that.$scope.$parent.documentationCtrl.list();
      that.NotificationService.show('Page ' + editPage.name + ' has been ' + (editPage.published ? '':'un') + 'published with success');
    });
  }

  hasNoTitle() {
    return _.isNil(this.page) || _.isNil(this.page.name) || _.isEmpty(this.page.name);
  }

  onPageUpdate() {
    this.NotificationService.show('Page \'' + this.page.name + '\' saved');
  }
}

export default PageController;
