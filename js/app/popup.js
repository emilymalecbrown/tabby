//not working yet
chrome.tabs.onCreated.addListener((tab) => {
    chrome.tabs.query({}, (tabs) => {
        if (tabs.length > 7) {
            chrome.browserAction.setIcon({
                "path": "./alert.png"
            })
        }
    });
});

app.service('TabbyService', function() {
    this.getInfo = function(callback) {
        var model = {};

        model.duplicateTabs = [];
        model.exactDuplicateIds = [];
        model.allDuplicateIds = [];
        model.softDuplicates = [];

        //find all open tabs using the chrome.tabs API
        chrome.tabs.query({},

            function (tabs) {

                //finds all EXACT duplicates
                findDuplicates = (tabs) => {
                    let duplicates = [];
                    for (let i=0; i<tabs.length-1; i++) {
                        for (let j=i+1; j<tabs.length; j++) {
                            if (tabs[i].url === tabs[j].url) {
                                duplicates.push(tabs[i]);
                                model.allDuplicateIds.push(tabs[i].id);
                                break;
                            }
                        }
                    }
                    return uniqueObj(duplicates);
                }

                //limits EXACT duplicates to unique duplicates
                uniqueObj = (objArr) => {
                    let unique = [];
                    for (let i=0; i<objArr.length-1; i++) {
                        let dups = false;
                        for (let j=i+1; j<objArr.length; j++) {
                            if (objArr[i].url === objArr[j].url) {
                                model.exactDuplicateIds.push(objArr[i].id);
                                dups = true;
                                break;
                            }
                        }
                        if (dups === false) {
                            model.duplicateTabs.push(objArr[i]);
                        }
                    }
                    model.exactDuplicateIds.push(objArr[objArr.length-1].id);
                    model.duplicateTabs.push(objArr[objArr.length-1]);
                }

                //finds all duplicates from same host ("soft duplicates")
                //could be DRYer
                findSoftDuplicates = (tabs) => {
                    for (let i=0; i<tabs.length-1; i++) {
                        for (let j=i+1; j<tabs.length; j++) {
                            if (new URL(tabs[i].url).hostname === new URL(tabs[j].url).hostname && (tabs[i].url !== tabs[j].url)) {
                                model.allDuplicateIds.push(tabs[i].id);
                                model.softDuplicates.push(tabs[i]);
                                break;
                            }
                        }
                    }
                },

            //find all soft duplicates
            findSoftDuplicates(tabs);

            //find all exact duplicates
            findDuplicates(tabs);

            //send object to callback
            callback(model);

        });

    },

    //removes a single tab
    this.removeTab = function(tabId) {
        chrome.tabs.remove(tabId, function() {
            console.log('tabRemoved')
        })
    },

    //removes all duplicate tabs
    this.removeAllDuplicates = function(tabIds) {
        chrome.tabs.remove(tabIds, function() {
            console.log('tabsRemoved');
        })
    }
});

app.controller("TabbyCtrl", function($scope, TabbyService) {

    $scope.message = "Welcome to Tabby";

    //put all relevant info on the $scope
    TabbyService.getInfo((info) => {
        $scope.duplicateTabs = info.duplicateTabs;
        $scope.softDuplicates = info.softDuplicates;
        $scope.exactDuplicateIds = info.exactDuplicateIds;
        $scope.allDuplicateIds = info.allDuplicateIds;

        $scope.$apply();
    });

    //remove a single tab
    $scope.removeTab = (tabId) => {
        TabbyService.removeTab(tabId, () => {
            $scope.apply();
        });
    };

    //remove all duplicates (exact or soft)
    $scope.removeAllDuplicates = (tabIds) => {
        TabbyService.removeTab(tabIds, () => {
            $scope.apply();
        });
    };

});



