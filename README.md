# background-data-service
AngularJs service that waits until network traffic is idle to make network calls in the background for future use

### Example

NOTE: TokenService, RecentService, FavoritesService are not provided.  You should replace TokenService with your 
authentication provider.  RecentService and FavoritesService are the services that should be called when idle.

```js
angular.module('yourApp').run(function ($q, TokenService, RecentService, FavoritesService) {
        // Data to get in the background when idle
        var deferredRecent = $q.defer();
        deferredRecent.promise.then(function(){
            RecentService.getRecent('patient');
            FavoritesService.getFavoritePrescriptions();
        });
        BackgroundDataService.callMeWhenIdle(deferredRecent);

        //Start the background idle timer after logging in, stop it when logging out
        $rootScope.$on(TokenService.authenticationStatusChanged, function (event, loggedIn) {
            if (loggedIn) {
                BackgroundDataService.init();
            } else {
                BackgroundDataService.stop();
            }
        });
    });
```

### Questions, Comments, Concerns?
Contact git@streetdeck.com
