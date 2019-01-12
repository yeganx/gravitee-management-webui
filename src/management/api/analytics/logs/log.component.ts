import {StateService} from "@uirouter/core";

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
const LogComponent: ng.IComponentOptions = {
  bindings: {
    log: '<'
  },
  controller: function($state: StateService) {
    'ngInject';

    this.backStateParams = {
      from: $state.params['from'],
      to: $state.params['to'],
      q: $state.params['q'],
    };
    this.getMimeType = function(log) {

      if (log.headers['Content-Type'] !== undefined) {
        let contentType = log.headers['Content-Type'][0];
        return contentType.split(';', 1)[0];
      }

      return null;
    };
  },
  template: require('./log.html')
};

export default LogComponent;
