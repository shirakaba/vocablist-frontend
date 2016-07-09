"use strict";

angular.module('kanjiApp', ['ngAnimate', 'ui.router']) // [''] contains dependencies.
    // by default, angular animates every class, so we need to configure its selection.
    .config(['$animateProvider', '$stateProvider', '$urlRouterProvider',
        function($animateProvider, $stateProvider, $urlRouterProvider){
            $urlRouterProvider.otherwise("/search");
            $animateProvider.classNameFilter(/houdini/); // filter for any class containing the string 'houdini'

            $stateProvider
            .state({
                name: 'search',
                url: "/search",
                templateUrl: "partials/search.html",
                // // The '$scope' directive is injected in as a dependency. By mutating the controller's $scope, you can mutate the webpage's view.
                controller: ["$scope", "$http", function(sc, $http) {
                    angular.extend(sc, {
                        fundChecked: true,
                        n1Checked: true,
                        n2Checked: true,
                        n3Checked: true,
                        n4Checked: true,
                        n5Checked: true,
                        fundamentalsFilter: function(item) {
                            // console.log(sc.fundChecked);
                            return sc.fundChecked || !item.fundamental;
                        },
                        n1Filter: function(item) {
                            // console.log(item);
                            return sc.n1Checked || !item.n1;
                        },
                        n2Filter: function(item) {
                            // console.log(item);
                            return sc.n2Checked || !item.n2;
                        },
                        n3Filter: function(item) {
                            // console.log(sc.fundChecked);
                            return sc.n3Checked || !item.n3;
                        },
                        n4Filter: function(item) {
                            // console.log(sc.fundChecked);
                            return sc.n4Checked || !item.n4;
                        },
                        n5Filter: function(item) {
                            // console.log(sc.fundChecked);
                            return sc.n5Checked || !item.n5;
                        },
                        mySearch: "生",
                        currentRow: [],
                        kanjidicReadingResults: [],
                        hideMe: false
                    });
                    // sc.mySearch = "生"; // the input field's value is bound to the value of this variable.
                    // sc.currentRow = [];
                    // sc.kanjidicReadingResults = [];
                    // sc.hideMe = false; // We declare this one only because our ng-show interacts with it. It's more about being explicit for documentation.

            //         sc.submit = function(query) {
            //             sc.mySearch = query;

            //             $.ajax({
            //                     url        : "http://127.0.0.1:3000",
            //                     dataType   : 'json',
            //                     contentType: 'application/json; charset=UTF-8',
            //                     data       : JSON.stringify({
            //                         "kanjiglyph": query
            //                     }),
            //                     type       : 'POST'
            //                 })
            //                 .done(function(data, textStatus, jqXHR) {
            //                     console.log(data); // logs the incoming data as javascript objects
            // //                  console.log(JSON.stringify(data, undefined, "  ")); // serialises the JSON to a string to emerge in Chrome console
            //                         sc.$apply(function() {
            //                             if(data.kanjidicReadingSearch.length){
            //                                 sc.hideMe = false;
            //                                     sc.searchQuery = data.receivedsearch;
            //                                     sc.hkanjiPageOnlyResult = data.hkanjiPageSearch || "";
            //                                     sc.hkanjiIndexOnlyResult = data.hkanjiIndexSearch || "";
            //                                     sc.hkanjiCodePointOnlyResult = data.hkanjiCodePointSearch || "";

            //                                     sc.kanjidicReadingResults = data.kanjidicReadingSearch;
            //                                     sc.kanjidicDefinitionResults = data.kanjidicDefinitionSearch;
            //                                     sc.kanjidicFrequencyResults = data.kanjidicFrequencySearch|| "";
            //                                     sc.kanjidicStrokeResults = data.kanjidicStrokeSearch|| "";
            //                                     sc.kanjidicJlptResults = data.kanjidicJlptSearch|| "";
            //                                     sc.kanjidicGradeResults = data.kanjidicGradeSearch|| "";
            //                             }
            //                             else{
            //                                 sc.hideMe = true;

            //                             }

            //                         });
            //                 })
            //                 .fail(function(jqXHR, textStatus, errorThrown) {
            //                     console.error(arguments);
            //                 });
            //         };

                    sc.submit = function(query) {
                        var partition = 0;
                        var limit = 95;
                        var input = "気候[編集]" +
                        "年間の平均気温は15℃前後で、ここ20年ほどはほぼ横ばいである。 最高気温もほぼ横ばいで推移しているが、1日の最高気温が30℃を越える日数、および1日の最低気温が25℃を超える日数は、1990年以降、増加傾向にある。";
                        // + "夏場に都内最高気温を記録することが多く、ニュースでもよく取り上げられる。" +
                        // "これは、もともと練馬区が比較的気温の上がりやすい内陸部に位置している上、都心部で発生したヒートアイランド現象による高温の空気が、夏場に吹く南風によって練馬区・埼玉県・群馬県方面に運ばれてくるためである、と考えられている。[8]" +
                        // "ただし、「練馬」が都内最高気温であったと報じられることについては、気象庁のアメダス観測所の配置[1]にも留意する必要がある。「練馬」の気温とは、当区に設置されたアメダス観測所[2]の観測データのことであり、23区内のアメダス観測所は「練馬」のほかには、東京（千代田区）、世田谷（世田谷区）、江戸川臨海（江戸川区）、羽田（大田区）のみの設置である。あくまでもこれらの観測所のデータとの比較でしかないため、「練馬」が都内最高気温であったと報じられた場合でも、練馬区近隣の区が練馬区より気温が高くなかったとは必ずしも言い切れない。アメダス観測所については、近年高層マンションが建ち並んだ事で風通しが悪くなった為、2012年12月、武蔵大学・江古田キャンパスから日本銀行石神井運動場跡地へ、7km西に移転した。" +
                        // "尚、年間降水量は約1,000mmから約2,000mmの間で増減しており、顕著な傾向は見られない。" +
                        // "しかし、近年は夏場に多く発生するゲリラ豪雨による冠水や浸水の被害が報告されることもあり、その対策の一環として雨水貯留施設を埋設する工事を進めている。[9]"
                        $http.get('http://localhost:8080/test6?'+'partition='+encodeURIComponent(partition)+'&limit='+encodeURIComponent(limit)+'&input='+encodeURIComponent(input))
                        .then(function(response) {
                            // console.log(response.data.cumulative);
                            // sc.$apply(function() {
                                sc.x = response.data.list;
                                // sc.x = response.data.cumulative;
                                // sc.idsToSearch = response.data.cumulative.id; // this is an array.
                            // });
                        },
                        function(response) {
                            console.error(response);
                        });
                    };

                    sc.submit();
                }]
            })
            .state({
                name: 'about',
                url: "/about",
                templateUrl: "partials/about.html"
            });
        }])
    .controller('navController', ['$scope', '$state', function($scope, $state) {
        $scope.$state = $state;
    }])

    // angularJS version of JQuery's slideDown() from http://stackoverflow.com/questions/22659729/modifying-dom-slidedown-slideup-with-angularjs-and-jquery
    .animation('.houdini', function() {
        var NG_HIDE_CLASS = 'ng-hide';
        return {
            beforeAddClass: function(element, className, done) {
                if(className === NG_HIDE_CLASS) {
                    element.slideUp(done);
                }
            },
            removeClass: function(element, className, done) {
                if(className === NG_HIDE_CLASS) {
                    element.hide().slideDown(done);
                }
            }
        }
    });
