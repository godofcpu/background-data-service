/*!
 * background-data-service
 * @author Chuck Holbrook chuck@streetdeck.com
 * See LICENSE in this repository for license information
 */

angular.module('backgroundData', []).config(function ($httpProvider) {
    $httpProvider.interceptors.push(globalBackgroundDataInterceptor);
});

var globalBackgroundDataInterceptor;

(function() {
    var _updateServiceTime;

    globalBackgroundDataInterceptor = function () { /* jshint ignore:line */

        return {
            'request': function (config) {
                if (_updateServiceTime) {
                    _updateServiceTime();
                }
                return config;
            },

            'response': function (response) {
                if (_updateServiceTime) {
                    _updateServiceTime();
                }
                return response;
            }
        };
    };

    'use strict';
    /**
     * We have some data that is global and likely to be used every time a user logs into the app at some point.  Its
     * not a priority until we go to the page, but if we have free service time, we should try and download it in the
     * background so we have it when we go to that page and render immediatly.  i.e. A recent items list
     * are good examples of this type of data
     * @example
     * The init function should be called from your app.js either when the app starts  or when logging in.  You should
     * call stop when you log out assuming you need to be authorized to call the services
     *
     *       BackgroundDataService.init();

     // Data to get in the background when idle
     var deferredRecent = $q.defer();
     deferredRecent.promise.then(function(){
                RecentService.getRecent('patient');
                FavoritesService.getFavoritePrescriptions();
            });
     BackgroundDataService.callMeWhenIdle(deferredRecent);
     *
     * @returns {{}}
     * @constructor
     */
    function BackgroundDataServiceFn($log, $timeout, $interval){

        var BackgroundDataService = {};

        //Wait for 5 seconds of being idle before trying to call signaling we are service call idle
        var _idleTimeoutSeconds = 3;

        //The time the last service call request or response was made
        var _lastServiceTime;

        var _idleIntervalId;
        var _isIdle = false;

        //Set to true when the backgroun data services are running
        var _isInitialized = false;

        //The promises that will be triggered in order
        var _deferralsToTrigger = [];

        _updateServiceTime = function() {
            _lastServiceTime = moment();
            _isIdle = false;
        };

        /**
         * Wait a few seconds after starting, the start looking at all network calls and waiting for a quiet period.
         */
        BackgroundDataService.stop = function() {
            _isInitialized = false;
            $interval.cancel(_idleIntervalId);
            _idleIntervalId = undefined;
        };

        /**
         * Wait a few seconds after starting, then start looking at all network calls and waiting for a quiet period.
         * @params idleTimeoutSeconds Override the idle timeout, the amount of time without any other service calls
         * happening to then gather our background data
         */
        BackgroundDataService.init = function initialize(idleTimeoutSeconds, debugLogging) {
            _isInitialized = true;

            if (idleTimeoutSeconds > 0) {
                _idleTimeoutSeconds = idleTimeoutSeconds;
            }

            if (!_idleIntervalId) {
                $timeout(function(){
                    if (!_idleIntervalId && _isInitialized) {
                        //Check once a second to see if we are idle
                        _idleIntervalId = $interval(function(){
                            if (moment().diff(_lastServiceTime, 'seconds') > _idleTimeoutSeconds) {
                                if (debugLogging) {
                                    $log.info('We are idle (' + moment().diff(_lastServiceTime, 'seconds') + ' seconds) and ready to call more services!');
                                }
                                _isIdle = true;
                                if (_deferralsToTrigger.length > 0) {
                                    if (debugLogging) {
                                        $log.info('Triggering idle promise (' + _deferralsToTrigger.length + ')!');
                                    }
                                    _deferralsToTrigger.pop().resolve();
                                } else {
                                    if (debugLogging) {
                                        $log.info('No more idle promises to trigger, shutting down!');
                                    }
                                    BackgroundDataService.stop();
                                }
                            }
                        }, 1000);
                    }
                }, 1000);
            }
        };


        /**
         * Register a promise that will be executed when idle.  The promises will be called in FIFO order and after
         * trigger when promise when idle, it will wait a second and then wait until we are idle again to trigger
         * the next
         */
        BackgroundDataService.callMeWhenIdle = function(deferral){
            _deferralsToTrigger.push(deferral);

            //If we are not actively watching the services, restart now
            if (_isInitialized && !_idleIntervalId) {
                BackgroundDataService.init();
            }
        };

        return BackgroundDataService;
    }

    angular.module('backgroundData').factory('BackgroundDataService',  BackgroundDataServiceFn);

})();