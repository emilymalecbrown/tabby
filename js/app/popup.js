app.service('TabbyService', function() {
    this.getInfo = function(callback) {
        var model = {};

        model.allTabs = [];
        model.duplicateIds = [];

        chrome.tabs.query({},

            function (tabs) {
                console.log(tabs);
                model.title = tabs[0].title;
                model.url = tabs[0].url;

                findDuplicates = (tabs) => {
                    let duplicates = [];
                    for (let i=0; i<tabs.length-1; i++) {
                        for (let j=i+1; j<tabs.length; j++) {
                            if (tabs[i].url === tabs[j].url) {
                                duplicates.push(tabs[i]);
                                break;
                            }
                        }
                    }
                    return uniqueObj(duplicates);
                }

                uniqueObj = (objArr) => {
                    let unique = [];
                    for (let i=0; i<objArr.length-1; i++) {
                        let dups = false;
                        for (let j=i+1; j<objArr.length; j++) {
                            if (objArr[i].url === objArr[j].url) {
                                model.duplicateIds.push(objArr[i].id);
                                dups = true;
                                break;
                            }
                        }
                        if (dups === false) {
                            model.allTabs.push(objArr[i]);
                        }
                    }
                    model.allTabs.push(objArr[objArr.length-1]);
                }
                findDuplicates(tabs);

                callback(model);

            });

        },

    this.removeTab = function(tabId) {
        chrome.tabs.remove(tabId, function() {
            console.log('tabRemoved')
        })
    },

    this.removeAllDuplicates = function(tabIds) {
        chrome.tabs.remove(tabIds, function() {
            console.log('tabsRemoved');
        })
    }
});

app.controller("TabbyCtrl", function ($scope, TabbyService) {


    $scope.message = "Welcome to Tabby";

    TabbyService.getInfo((info) => {
        $scope.title = info.title;
        $scope.url = info.url;
        $scope.allTabs = info.allTabs;
        $scope.duplicateIds = [];
        info.allTabs.forEach((tab) => {
            $scope.duplicateIds.push(tab.id);
        });
        $scope.$apply();
    });

    $scope.removeTab = function(tabId) {
        TabbyService.removeTab(tabId, function() {
            $scope.apply();
        });
    };

    $scope.removeAllDuplicates = function(tabIds) {
        TabbyService.removeTab(tabIds, function() {
            $scope.apply();
        });
    };

});



