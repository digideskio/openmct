/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [
        './modes/FixedMode',
        './modes/FollowMode'
    ],
    function (FixedMode, FollowMode) {

        function TimeConductorViewService(conductor, timeSystems) {
            timeSystems = timeSystems.map(function (timeSystemConstructor){
                return timeSystemConstructor();
            });

            this._conductor = conductor;
            this._mode = undefined;
            this._availableModes = {
                'fixed': {
                    key: 'fixed',
                    implementation: FixedMode,
                    cssclass: 'icon-calendar',
                    label: 'Fixed',
                    name: 'Fixed Timespan Mode',
                    description: 'Query and explore data that falls between two fixed datetimes.'
                }
            };

            function timeSystemsForSourceType(sourceType) {
                return timeSystems.filter(function (timeSystem){
                    return timeSystem.tickSources().some(function (tickSource){
                        return tickSource.type() === sourceType;
                    });
                });
            }

            //Only show 'real-time mode' if a clock source is available
            if (timeSystemsForSourceType('clock').length > 0 ) {
                this._availableModes['realtime'] = {
                    key: 'realtime',
                    implementation: FollowMode,
                    cssclass: 'icon-clock',
                    label: 'Real-time',
                    name: 'Real-time Mode',
                    tickSourceType: 'clock',
                    description: 'Monitor real-time streaming data as it comes in. The Time Conductor and displays will automatically advance themselves based on a UTC clock.'
                };
            }

            //Only show 'real-time mode' if a clock source is available
            if (timeSystemsForSourceType('data').length > 0) {
                this._availableModes['latest'] = {
                    key: 'latest',
                    implementation: FollowMode,
                    cssclass: 'icon-database',
                    label: 'LAD',
                    name: 'LAD Mode',
                    tickSourceType: 'data',
                    description: 'Latest Available Data mode monitors real-time streaming data as it comes in. The Time Conductor and displays will only advance when data becomes available.'
                };
            }
        }

        /*
         * TimeConductorViewService.prototype.mode = function (key) {
         *      Change time conductor mode to match key
         *      var mode = this._availableModes[key];
         *      mode.doStuff();
         *
         * }
         */

        TimeConductorViewService.prototype.mode = function (newModeKey) {
            if (arguments.length === 1) {
                var mode = undefined;
                var timeSystem = this._conductor.timeSystem();
                var modes = this.availableModes();
                var modeMetaData = modes[newModeKey];

                if (this._mode) {
                    this._mode.destroy();
                }

                function contains(timeSystems, timeSystem) {
                    return timeSystems.find(function (t) {
                            return t.metadata.key === timeSystem.metadata.key;
                        }) !== undefined;
                }

                switch (newModeKey) {
                    case 'fixed':
                        mode = new FixedMode(modeMetaData, this._conductor, this._timeSystems);
                        this.conductorViewService.mode(mode);
                        if (!timeSystem) {
                            timeSystem = mode.availableTimeSystems()[0];
                            this.conductor.timeSystem(timeSystem, timeSystem.defaults().bounds);
                        }
                        break;
                    case 'realtime':
                    case 'latest':
                        mode = new FollowMode(modeMetaData, this._conductor, this._timeSystems);
                        this.mode(mode);
                        //Use current conductor time system if supported by
                        // new mode, otherwise use first available time system
                        if (!contains(mode.availableTimeSystems(), timeSystem)) {
                            timeSystem = mode.availableTimeSystems()[0];
                        }
                        break;
                }
                mode.initialize();

                this._mode = mode;
            }
            return this._mode;
        };

        TimeConductorViewService.prototype.availableModes = function () {
            return this._availableModes;
        };

        TimeConductorViewService.prototype.availableTimeSystems = function () {
            return this._mode.availableTimeSystems();
        }

        TimeConductorViewService.prototype.deltas = function () {
        };

        return TimeConductorViewService;
    }
);
