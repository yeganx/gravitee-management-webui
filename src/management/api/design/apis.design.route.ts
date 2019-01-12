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
import TenantService from '../../../services/tenant.service';
import ResourceService from '../../../services/resource.service';

export default apisDesignRouterConfig;

function apisDesignRouterConfig($stateProvider) {
  'ngInject';
  $stateProvider
    .state('management.apis.detail.design', {
      template: require("./apis.design.route.html")
    })
    .state('management.apis.detail.design.policies', {
      url: '/policies',
      template: require('./policies/apiPolicies.html'),
      controller: 'ApiPoliciesController',
      controllerAs: 'apiPoliciesCtrl',
      resolve: {
        resolvedTenants: (TenantService: TenantService) => TenantService.list()
      },
      data: {
        menu: {
          label: 'Design',
          icon: 'palette'
        },
        perms: {
          only: ['api-definition-r']
        },
        docs: {
          page: 'management-api-policies'
        }
      }
    })
    .state('management.apis.detail.design.resources', {
      url: '/resources',
      template: require('./resources/resources.html'),
      controller: 'ApiResourcesController',
      controllerAs: 'apiResourcesCtrl',
      resolve: {
        resolvedResources: (ResourceService: ResourceService) => ResourceService.list()
      },
      data: {
        perms: {
          only: ['api-definition-r']
        },
        docs: {
          page: 'management-api-resources'
        }
      }
    })
    .state('management.apis.detail.design.properties', {
      url: '/properties',
      template: require('./properties/properties.html'),
      controller: 'ApiPropertiesController',
      controllerAs: 'apiPropertiesCtrl',
      data: {
        perms: {
          only: ['api-definition-r']
        },
        docs: {
          page: 'management-api-properties'
        }
      }
    });
}
