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
import moment = require('moment');
import { StateService } from '@uirouter/core';
import {Moment} from "moment";

interface Timeframe {
  id: string,
  title: string,
  range: number,
  interval: number
}

class LogsTimeframeController {
  private now: Date;
  private timeframes: Timeframe[];
  private timeframe: Timeframe;
  private pickerStartDate: Moment;
  private pickerEndDate: Moment;
  private current: any;
  private onTimeframeChange: any;

  constructor(
    private $scope,
    private $rootScope,
    private $state: StateService,
    private $timeout: ng.ITimeoutService) {
    'ngInject';

    this.now = moment().toDate();

    let that = this;

    this.timeframes = [
      {
        id: '5m',
        title: 'Last 5m',
        range: 1000 * 60 * 5,
        interval: 1000 * 10
      }, {
        id: '30m',
        title: ' 30m',
        range: 1000 * 60 * 30,
        interval: 1000 * 15
      }, {
        id: '1h',
        title: ' 1h',
        range: 1000 * 60 * 60,
        interval: 1000 * 30
      }, {
        id: '3h',
        title: ' 3h',
        range: 1000 * 60 * 60 * 3,
        interval: 1000 * 60
      }, {
        id: '6h',
        title: ' 6h',
        range: 1000 * 60 * 60 * 6,
        interval: 1000 * 60 * 2
      }, {
        id: '12h',
        title: ' 12h',
        range: 1000 * 60 * 60 * 12,
        interval: 1000 * 60 * 5
      }, {
        id: '1d',
        title: '1d',
        range: 1000 * 60 * 60 * 24,
        interval: 1000 * 60 * 10
      }, {
        id: '3d',
        title: '3d',
        range: 1000 * 60 * 60 * 24 * 3,
        interval: 1000 * 60 * 30
      }, {
        id: '7d',
        title: '7d',
        range: 1000 * 60 * 60 * 24 * 7,
        interval: 1000 * 60 * 60
      }, {
        id: '14d',
        title: '14d',
        range: 1000 * 60 * 60 * 24 * 14,
        interval: 1000 * 60 * 60 * 3
      }, {
        id: '30d',
        title: '30d',
        range: 1000 * 60 * 60 * 24 * 30,
        interval: 1000 * 60 * 60 * 6
      }, {
        id: '90d',
        title: '90d',
        range: 1000 * 60 * 60 * 24 * 90,
        interval: 1000 * 60 * 60 * 12
      }
    ];

    // Event received when a zoom is done on a chart
    this.$rootScope.$on('timeframeZoom', function (event, zoom) {
      let diff = zoom.to - zoom.from;

      let timeframe = _.findLast(that.timeframes, function (timeframe: Timeframe) {
        return timeframe.range < diff;
      });

      if (!timeframe) {
        timeframe = that.timeframes[0];
      }

      that.update({
        interval: timeframe.interval,
        from: zoom.from,
        to: zoom.to
      });
    });
  }

  $onInit() {
    let updated = false;
    if (this.$state.params['from'] && this.$state.params['to']) {
      updated = true;

      this.update({
        from: this.$state.params['from'],
        to: this.$state.params['to']
      });
    } else {
      this.setTimeframe(this.$state.params['timeframe'] || '1d', !updated);
    }
  };

  updateTimeframe(timeframeId) {
    if (timeframeId) {
      this.$state.transitionTo(
        this.$state.current,
        _.merge(this.$state.params, {
          timestamp: '',
          timeframe: timeframeId
        }),
        {notify: false});
      this.setTimeframe(timeframeId, true);
    }
  }

  setTimestamp(timestamp) {
    var momentDate = moment.unix(timestamp);

    var startDate = Math.floor(momentDate.startOf('day').valueOf() / 1000);
    var endDate = Math.floor(momentDate.endOf('day').valueOf() / 1000);

    this.update({
      interval: 1000 * 60 * 5,
      from: startDate * 1000,
      to: endDate * 1000
    });
  }

  setTimeframe(timeframeId, update) {
    var that = this;

    this.timeframe = _.find(this.timeframes, function (timeframe: Timeframe) {
      return timeframe.id === timeframeId;
    });

    if (update) {
      var now = Date.now();

      this.update({
        interval: that.timeframe.interval,
        from: now - that.timeframe.range,
        to: now
      });
    }
  }

  update(timeframeParam) {
    let that = this;

    let timeframe = {
      interval: parseInt(timeframeParam.interval),
      from: parseInt(timeframeParam.from),
      to: parseInt(timeframeParam.to)
    };

    // Select the best timeframe
    let diff = timeframe.to - timeframe.from;

    let tf = _.findLast(that.timeframes, function (tframe: Timeframe) {
      return tframe.range <= diff;
    });

    this.timeframe = tf ? tf : that.timeframes[0];

    // timeframeChange event is dynamically initialized, so we have to define a timeout to correctly fired it
    this.$timeout(function () {
      let event = {
        interval: that.timeframe.interval,
        from: timeframe.from,
        to: timeframe.to
      };

      that.onTimeframeChange({timeframe: event});
    }, 200);

    this.current = {
      interval: this.timeframe.interval,
      intervalLabel: moment.duration(this.timeframe.interval).humanize(),
      from: timeframe.from,
      to: timeframe.to
    };

    this.$state.transitionTo(
      this.$state.current, _.merge(this.$state.params, this.current));

    this.pickerStartDate = moment(timeframe.from);
    this.pickerEndDate = moment(timeframe.to);
  }

  updateRangeDate() {
    let from =  this.pickerStartDate.startOf("minute").unix() * 1000;
    let to = this.pickerEndDate.endOf("minute").unix() * 1000;

    let diff = to - from;

    let timeframe = _.findLast(this.timeframes, function (timeframe: Timeframe) {
      return timeframe.range < diff;
    });

    if (!timeframe) {
      timeframe = this.timeframes[0];
    }

    this.update({
      interval: timeframe.interval,
      from: from,
      to: to
    });
  }
}

export default LogsTimeframeController;
