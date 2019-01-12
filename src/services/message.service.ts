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

class MessageService {
  private baseURL: string;

  constructor(private $http, Constants) {
    'ngInject';
    this.baseURL = Constants.baseURL;
  }

  sendFromPortal(title: string, text: string, channel: string, roleScope: string, roleValues: string[], url: string, useSystemProxy: boolean, httpHeaders: string[]) {
    return this.$http.post(
      `${this.baseURL}messages`,
      this.getPayload(title, text, channel, roleScope, roleValues, url, useSystemProxy, httpHeaders)
    );
  }

  sendFromApi(apiId: string, title: string, text: string, channel: string, roleScope: string, roleValues: string[], url: string, useSystemProxy: boolean, httpHeaders: string[]) {
    return this.$http.post(
      `${this.baseURL}apis/${apiId}/messages`,
      this.getPayload(title, text, channel, roleScope, roleValues, url, useSystemProxy, httpHeaders)
    );
  }

  private getPayload(title: string, text: string, channel: string, roleScope: string, roleValues: string[], url: string, useSystemProxy: boolean, httpHeaders: string[]) {
    if (url) {
      let params = {};
      for (let idx=0; idx < httpHeaders.length; idx ++) {
        if (httpHeaders[idx]["key"] !== "") {
          params[httpHeaders[idx]["key"]] = httpHeaders[idx]["value"];
        }
      }
      return {
        "text": text,
        "recipient": {
          "url": url
        },
        "channel": channel,
        "params": params,
        "useSystemProxy": useSystemProxy
      }
    } else {
      return {
        "title": title,
        "text": text,
        "recipient": {
          "role_scope": roleScope,
          "role_value": roleValues
        },
        "channel": channel
      }
    }
  }
}

export default MessageService;
