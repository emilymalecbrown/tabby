var myAudio = new Audio();        // create the audio object
myAudio.src = "../../img/airhorn.mp3";

// if you have too many tabs
//1. changes icon to alert
//2. plays annoying noise
chrome.tabs.onCreated.addListener((tab) => {
    chrome.tabs.query({}, (tabs) => {
        if (tabs.length > 7) {
            myAudio.play();
            chrome.browserAction.setIcon({
                path: "../../img/alert.png"
            })
        }
    });
});

//if you remove enough tabs... tabby comes back!
chrome.tabs.onRemoved.addListener((tab) => {
    chrome.tabs.query({}, (tabs) => {
        if (tabs.length <= 7) {
            chrome.browserAction.setIcon({
                path: "../../img/tabby_16.png"
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

    //removes tabs
    this.removeTab = function(tabsId) {
        chrome.tabs.remove(tabsId, function() {
            console.log('tabRemoved')
        })
    },

    //removes all but active and pinned tabs
    this.removeAllTabs = function() {
        chrome.tabs.query({"active": false, "pinned": false}, function(tabs) {
            for (let i=0; i<tabs.length; i++) {
                chrome.tabs.remove(tabs[i].id);
            }
        });
    };

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

    //removes all but active and pinned tabs
    $scope.removeAllTabs = (tabIds) => {
        TabbyService.removeAllTabs();
    }

});
