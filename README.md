# background-data-service
AngularJs service that waits until network traffic is idle to make network calls in the background for future use

## Get Started

**(1)** Use Bower to get 
`$ bower install background-data-service` 

**(2)** Include `BackgroundDataService.js` in your angular app

**(3)** Add `backgroundData` to your main module's list of dependencies 

**(4)** Call `BackgroundDataService.init()` after logging into your app and register deferral objects with 
`BackgroundDataService.callMeWhenIdle(deferredRecent);` for all the background services you want to call.  See the
example section for more details.



### Example

NOTE: This is an **Incomplete Example** TokenService, RecentService, FavoritesService are not provided.  You should replace TokenService with your 
authentication provider.  RecentService and FavoritesService are the services that should be called when idle.

```js
angular.module('yourApp').run(function ($q, $rootScope, TokenService, RecentService, FavoritesService) {
        // Data to get in the background when idle
        var deferredRecent = $q.defer();
        deferredRecent.promise.then(function(){
            //This calls two services simultaneously as the data they retrieve is small.  Register mulitple deferral
            //objects if your are retrieveing large amounts in the data in the background and don't want to over tax
            //your app.  
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
