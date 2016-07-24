"use strict";

angular.module('kanjiApp', ['ngAnimate', 'ui.router', 'ui.bootstrap-slider', 'dndLists', 'timer']) // [''] contains dependencies.
    // by default, angular animates every class, so we need to configure its selection.
    .config(['$animateProvider', '$stateProvider', '$urlRouterProvider', '$sceProvider',
        function($animateProvider, $stateProvider, $urlRouterProvider, $sceProvider){
            $urlRouterProvider.otherwise("/generator");
            $animateProvider.classNameFilter(/houdini/); // filter for any class containing the string 'houdini'

            // Completely disable SCE.  For demonstration purposes only!
            // Do not use in new projects.
            $sceProvider.enabled(false);

            $stateProvider
            // state for generator partial.
            .state({
                name: 'generator',
                url: "/generator",
                templateUrl: "partials/generator.html",
                controller: ["$scope", "$http", function(sc, $http) {
                    angular.extend(sc, {
                        // http://stackoverflow.com/questions/12618342/ng-model-does-not-update-controller-value
                        formData: {
                            consent: false,
                            gender: "other",
                            age: 100,
                            exposure: "low",
                            source: "other",
                            issues: "",
                            ownchoice: false,
                            // category: null,
                            proficiency: 2
                        },
                        uid: "",
                        // consent: false,
                        overtime: false,
                        postmanError: false,
                        reportSent: false,
                        startedSearch: false,
                        finishedSearch: false,
                        generatedSelection: "none",
                        generatedOptions: [
                            "Biology",
                            "Physics",
                            "Chemistry", 
                            "Economics", 
                            "Politics"
                        ],
                        generateUid: function(){
                            return (Math.random()*1e32).toString(36);
                        },
                        overTime: function(){
                            sc.$apply(function() {
                                sc.overtime = true;
                            });
                        },
                        ageReport: function(age) {
                            if(age === 100) return "?";
                            else return age.toString();
                        },
                        filteringEnum: function(value) {
                            switch(value){
                                case 2:
                                    return "n5";
                                case 3:
                                    return "n4";
                                case 4:
                                    return "n3";
                                case 5:
                                    return "n2";
                                case 6:
                                    return "n1";
                                default:
                                    return "n5";
                            }
                        },
                    });
                    // sc.makeList = function (uid, extension, feedback, separator) {
                    //     // console.log("feedback: " + feedback);
                    //     // feedback = JSON.parse(feedback);
                    //     $.ajax({
                    //             url        : "http://127.0.0.1:3000/generator",
                    //             dataType   : 'json',
                    //             contentType: 'application/json; charset=UTF-8',
                    //             data       : JSON.stringify(feedback),
                    //             type       : 'POST'
                    //         })
                    //         .done(function(data, textStatus, jqXHR) {
                    //             // console.log(data); // logs the incoming data as javascript objects
                    //             sc.$apply(function() {
                    //                 sc.reportSent = true;
                    //             });
                    //         })
                    //         .fail(function(jqXHR, textStatus, errorThrown) {

                    //             console.error(arguments);
                    //         })
                    //     ;
                    // },

                    /** Two modes: Append to the user's report, or make main JSON. */
                    sc.postman = function(uid, extension, input, separator){
                        // HTTP.POST is the angular version, 
                        $.ajax({
                                url        : "http://127.0.0.1:3000/generator",
                                // dataType   : 'json', // this is the expected payload type. Doesn't like response.status(200).end()
                                contentType: 'application/json; charset=UTF-8',
                                data       : JSON.stringify({
                                    "uid": uid,
                                    "input": input,
                                    "separator": separator,
                                    "extension": extension
                                }),
                                type       : 'POST'
                            })
                            // HTTP 200 may send you in here
                            .done(function(data, textStatus, jqXHR) {
                                // console.log(data); // logs the incoming data as javascript objects
                                sc.$apply(function() {
                                    sc.reportSent = true;
                                    sc.postmanError = false;
                                });
                            })
                            // HTTP 500 may send you in here
                            .fail(function(jqXHR, textStatus, errorThrown) {
                                console.error(arguments);
                                sc.$apply(function() {
                                    sc.postmanError = true;
                                    sc.finishedSearch = false;
                                    sc.startedSearch = false;
                                });
                            })
                        ;
                    },

                    /** Generates the main JSON and report via postman(). */
                    sc.generate = function(cat) {
                        console.log('input proficiency was:' + sc.formData.proficiency);
                        if(cat == null) {
                            console.log("category was null.");
                            sc.$apply(function() {
                                sc.startedSearch = false;
                            });
                            return;
                        }
                        $http.get(
                            'http://localhost:8080/generate?'
                            +'partition='+encodeURIComponent(250)
                            +'&makequiz='+encodeURIComponent(true)
                            +'&maxarticles='+encodeURIComponent(1)
                            +'&filtering='+encodeURIComponent(sc.filteringEnum(sc.formData.proficiency))
                            +'&egs='+encodeURIComponent(2)
                            +'&limit='+encodeURIComponent(100.0)
                            +'&minyield='+encodeURIComponent(0.0)
                            +'&input='+encodeURIComponent(sc.category)
                            )

                            .then(
                                function (response) {
                                    // For some reason, this is enclosed by sc.$apply() from elsewhere, so another is unneeded.
                                    sc.finishedSearch = true;
                                    sc.uid = sc.generateUid();

                                    console.log('reported proficiency was:' + sc.formData.proficiency);
                                    var report = {
                                        "uid": sc.uid,
                                        "gender": sc.formData.gender,
                                        "age": sc.ageReport(sc.formData.age),
                                        "exposure": sc.formData.exposure,
                                        "proficiency": sc.filteringEnum(sc.formData.proficiency),
                                        "source": sc.formData.source,
                                        "issues": sc.formData.issues,
                                        "category": sc.category
                                    };
                                    var stage = {
                                        "stage": 'quizAPending'
                                    };
                                    console.log(report);
                                    sc.postman(sc.uid, '.json', response.data, ''); // The JSON
                                    sc.postman(sc.uid, '.txt', report, '/*=== First contents ===*/\n'); // The report
                                    sc.postman(sc.uid, '.status', stage, ''); // The report
                                }

                                /** For automatically serving the user a .txt file of the GET response (the main JSON) */
                                // function(response) {
                                //     // console.log("got this far.");
                                //     console.log(response.data);
                                //     var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data));
                                //     // from http://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
                                //     var dlAnchorElem = document.getElementById('downloadAnchorElem');
                                //     dlAnchorElem.setAttribute("href",     dataStr     );
                                //     dlAnchorElem.setAttribute("download", "vocablist.json");
                                //     dlAnchorElem.click();

                                //     sc.finishedSearch = true;
                                // }
                                ,

                                function(response) {
                                    console.error(response);
                                }
                            );
                    };

                    // console.log("starting functions.");
                    // var fb = {
                    //  "info":"結社",
                    //  "target":"association ･ society"
                    // };
                    // sc.report('abcdef123', '.txt', fb, '/*=== First contents ===*/\n');
                }]
            })
            
            // state for search partial.
            .state({
                name: 'list',
                url: "/list?uid",
                templateUrl: "partials/list.html",
                // // The '$scope' directive is injected in as a dependency. By mutating the controller's $scope, you can mutate the webpage's view.
                controller: ["$scope", "$http", "$stateParams", function(sc, $http, $stateParams) {
                    angular.extend(sc, {
                        // articles: ["", ""],
                        limit: 100,
                        partition: 0,
                        minyield: 0.00,
                        egs: 0,
                        filtering: 0,
                        maxArticles: 1,
                        makeQuiz: true,
                        f: {
                            fundChecked: true,
                            n1Checked: true,
                            n2Checked: true,
                            n3Checked: true,
                            n4Checked: true,
                            n5Checked: true
                        },
                        showEg: false,
                        showFirstEg: true,
                        qScore: 0,
                        ready: false,
                        fundamentalsFilter: function(item) {
                            return sc.f.fundChecked || !item.fundamental;
                        },
                        n1Filter: function(item) {
                            return sc.f.n1Checked || !item.n1;
                        },
                        n2Filter: function(item) {
                            return sc.f.n2Checked || !item.n2;
                        },
                        n3Filter: function(item) {
                            return sc.f.n3Checked || !item.n3;
                        },
                        n4Filter: function(item) {
                            return sc.f.n4Checked || !item.n4;
                        },
                        n5Filter: function(item) {
                            return sc.f.n5Checked || !item.n5;
                        },
                        filteringEnum: function(value) {
                            switch(value){
                                case 0:
                                    return "mandatory";
                                case 1:
                                    return "fundamental";
                                case 2:
                                    return "n5";
                                case 3:
                                    return "n4";
                                case 4:
                                    return "n3";
                                case 5:
                                    return "n2";
                                case 6:
                                    return "n1";
                                default:
                                    return "mandatory";
                            }
                        },
                        filteringEnumR: function(label) {
                            switch(label){
                                case "mandatory":
                                    return 0;
                                case "fundamental":
                                    return 1;
                                case "n5":
                                    return 2;
                                case "n4":
                                    return 3;
                                case "n3":
                                    return 4;
                                case "n2":
                                    return 5;
                                case "n1":
                                    return 6;
                                default:
                                    return 0;
                            }
                        },
                        mySearch: "東方Project",
                        currentRow: [],
                        kanjidicReadingResults: [],
                        hideMe: false,
                        parseSentence: function(sentence) {
                            return sentence
                            .split('{{{').join('<span class="sentence-bold">')
                            .split('}}}').join('</span>');
                        },
                        readI : function(uid, extension){
                            sc.readError = false;
                            sc.uid = uid; // Redundant except for when landing on the page without giving a uid.
                            $.ajax({
                                url        : "http://127.0.0.1:3000/quiz",
                                dataType   : 'json',
                                contentType: 'application/json; charset=UTF-8',
                                data       : JSON.stringify({
                                    "uid": uid,
                                    "extension": extension
                                }),
                                type       : 'POST'
                            })
                            .done(function(contents, textStatus, jqXHR) {
                                // console.log("reading.");
                                // console.log(contents);
                                sc.$apply(function() {
                                    // var fullResponse = JSON.parse(contents);

                                    if(extension === '.status'){
                                        sc.stage = contents.stage;
                                        // console.log("status read.");
                                    }
                                    if(extension === '.json'){
                                        // can access sc.stage √
                                        sc.readError = false;
                                        sc.initI(contents, sc.stage);
                                        sc.ready = true;
                                        // console.log("JSON read.");
                                        // sc.reportScores(); // TODO: move this to a sensible place rather than its current on-read place.
                                    }
                                });

                            })
                            .fail(function(jqXHR, textStatus, errorThrown) {
                                sc.$apply(function() {
                                    sc.readError = true;
                                    sc.ready = false;
                                });
                                console.error(arguments);
                            })
                        ;
                        }
                    });

                    /** Initialises the quiz based on a JSON. */
                    sc.initI = function(jsonParsedresponse){
                        sc.x = jsonParsedresponse.list;
                        sc.topic = jsonParsedresponse.topic;
                        sc.articles = jsonParsedresponse.successfulArticles;
                        sc.prefiltering = jsonParsedresponse.prefiltering;
                    }


                    // THESE START ON PAGE LOAD:
                    sc.uid = $stateParams['uid'];
                    if(sc.uid != null) sc.readI(sc.uid, '.json');
                }]
            })

            // state for quiz partial.
            .state({
                name: 'quiz',
                url: "/quiz?uid",
                templateUrl: "partials/quiz.html",
                uidSelected: false,
                // // The '$scope' directive is injected in as a dependency. By mutating the controller's $scope, you can mutate the webpage's view.
                controller: ["$scope", "$http", "$stateParams", function(sc, $http, $stateParams) {
                    angular.extend(sc, {
                        finishedAlready: false,
                        ready: false,
                        practised: false,
                        readError: false,
                        qScore: 0,
                        sampleTestr: {"answers":[{"bucket": []},{"bucket": []},{"bucket": []},{"bucket": []}],"testType":"kanji","eleType":"kanjiOne","tierAlpha":"One","allowedTypes":["kanjiOne"],"qus":[{"info":"補完","target":"supplementation ･ complementation ･ completion"},{"info":"作画","target":"taking photographs ･ drawing pictures"},{"info":"初期","target":"(1) early (days) ･ initial stage;  (2) initial"},{"info":"東急","target":"[fem] Noboru ･ [surname] Toukyuu ･ [unclass] Noboru"}]}
                        ,
                        sampleTestrw: {"testType":"kanji","eleType":"kanjiOne","tierAlpha":"One","allowedTypes":["kanjiOne"],"qus":[{"info":"貞","target":"[given] Misao ･ [given] Tadashi ･ [fem,surname] Sada ･ [unclass] Sadanori ･ [given] Takashi ･ [fem,surname] Tei ･ [given] Sadamu ･ [unclass] Sadatsugu ･ [unclass] Teiji ･ [fem] Misao ･ [given] Tadasu ･ [fem] Teiko ･ [unclass] Sadaji ･ [unclass] Sadazumi ･ [unclass] Sadayuki"},{"info":"補完","target":"supplementation ･ complementation ･ completion"},{"info":"作画","target":"taking photographs ･ drawing pictures"},{"info":"綾","target":"(1) figure ･ design;  (2) twill weave ･ pattern of diagonal stripes;  (3) style (of writing) ･ figure (of speech);  (4) plan ･ plot ･ design;  (5) minor market fluctuation ･ technical correction;  (6) cat's cradle;  (7) lease rod (in a loom)"},{"info":"初期","target":"(1) early (days) ･ initial stage;  (2) initial"},{"info":"東急","target":"[fem] Noboru ･ [surname] Toukyuu ･ [unclass] Noboru"}]}
                        ,
                        // stage: 'quizAPending',
                        /** 
                          * Looks up file name corresponding to uid stored on the host machine, with two modes:
                          * (1) if extension is '.json', reads the main JSON file.
                          * (2) if extension is '.status', reads the quiz status file.
                          * */
                        read : function(uid, extension){
                            $.ajax({
                                url        : "http://127.0.0.1:3000/quiz",
                                dataType   : 'json',
                                contentType: 'application/json; charset=UTF-8',
                                data       : JSON.stringify({
                                    "uid": uid,
                                    "extension": extension
                                }),
                                type       : 'POST'
                            })
                            .done(function(contents, textStatus, jqXHR) {
                                // console.log("reading.");
                                // console.log(contents);
                                sc.$apply(function() {
                                    // var fullResponse = JSON.parse(contents);

                                    if(extension === '.status'){
                                        sc.stage = contents.stage;
                                        // console.log("status read.");
                                    }
                                    if(extension === '.json'){
                                        // can access sc.stage √
                                        sc.readError = false;
                                        sc.init(contents, sc.stage);
                                        sc.ready = true;
                                        // console.log("JSON read.");
                                        // sc.reportScores(); // TODO: move this to a sensible place rather than its current on-read place.
                                    }
                                });

                            })
                            .fail(function(jqXHR, textStatus, errorThrown) {
                                sc.$apply(function() {
                                    sc.readError = true;
                                    sc.ready = false;
                                });
                                console.error(arguments);
                            })
                        ;
                        },

                        /** For the user to upload a file to the host machine. */
                        // // http://stackoverflow.com/questions/18571001/file-upload-using-angularjs
                        // add : function(){
                        //     var f = document.getElementById('file').files[0];
                        //     var r = new FileReader();

                        //     r.onloadend = function(e){
                        //         sc.$apply(function() {
                        //             // sc.allResponse = e.target.result;
                        //             console.log(e.target.result);
                        //             sc.init(JSON.parse(e.target.result));
                        //             sc.ready = true;
                        //         });
                        //       //send your binary data via $http or $resource or do anything else with it
                        //     }

                        //     r.readAsText(f, "utf-8");
                        // },

                        calculateTestScore: function(rTest, answers){
                            var testScore = 0;
                            for(var i=0; i < rTest.length; i++){
                                if(answers[i].bucket.length > 0)
                                    if(rTest[i].target === answers[i].bucket[0].target) testScore++;
                            }
                            return testScore;
                        },
                        calculateTierScore: function(rTier){
                            var tierScore = 0;
                            for(var i=0; i < rTier.tests.length; i++){
                               tierScore += sc.calculateTestScore(rTier.tests[i].qus, rTier.tests[i].answers);
                            }
                            return tierScore;
                        },
                        calculateQuizScore: function(rQuiz){
                            var quizScore = 0;
                            for(var i=0; i < rQuiz.length; i++){
                                quizScore += sc.calculateTierScore(rQuiz[i]);
                            }
                            return quizScore;
                        },
                        hideMe: true
                    });

                    /** Initialises the quiz based on a JSON. */
                    sc.init = function(jsonParsedresponse){
                        // sc.allResponse = [{"list":[{"defs":["アニメ：(1) animated cartoon ･ animated film ･ anime (when referring to Japanese cartoons);  (2) animation"],"pos":"noun","exampleSentences":[],"iso":0.036945812,"n2":false,"bf":"アニメ","cumu":0.036945812,"n4":false,"n3":false,"n1":false,"n5":false,"fundamental":false},{"defs":["使徒 [しと]：disciple ･ apostle"],"pos":"noun","exampleSentences":[],"iso":0.019704433,"n2":false,"bf":"使徒","cumu":0.056650244,"n4":false,"n3":false,"n1":false,"n5":false,"fundamental":false},{"defs":["牝鹿 / 雌鹿 [めか / めが / めしか / めじか]：doe (female deer)"],"pos":"noun","exampleSentences":[],"iso":8.2101807E-4,"n2":false,"bf":"メカ","cumu":0.9999919,"n4":false,"n3":false,"n1":false,"n5":false,"fundamental":false}],"quizA":[{"tests":[{"testType":"kanji","eleType":"kanjiOne","tierAlpha":"One","allowedTypes":["kanjiOne"],"qus":[{"info":"補完","target":"supplementation ･ complementation ･ completion"},{"info":"作画","target":"taking photographs ･ drawing pictures"},{"info":"初期","target":"(1) early (days) ･ initial stage;  (2) initial"},{"info":"東急","target":"[fem] Noboru ･ [surname] Toukyuu ･ [unclass] Noboru"}]},{"testType":"pron","eleType":"pronOne","tierAlpha":"One","allowedTypes":["pronOne"],"qus":[{"info":"とうしょ","target":"at first"},{"info":"しんさく","target":"new production ･ new work"},{"info":"せんし","target":"soldier ･ warrior ･ combatant"},{"info":"い / いつ / ご","target":"five"}]},{"testType":"def","eleType":"defOne","tierAlpha":"One","allowedTypes":["defOne"],"qus":[{"info":"conclusion ･ end","target":"結末 [けつまつ]"},{"info":"battleship","target":"戦艦 [せんかん]"},{"info":"hermitage ･ retreat","target":"庵 / 廬 / 菴 [あん / いお / いおり]"},{"info":"-ification ･ action of making something","target":"化 [か]"}]}]},{"tests":[{"testType":"kanji","eleType":"kanjiTwo","tierAlpha":"Two","allowedTypes":["kanjiTwo"],"qus":[{"info":"造形","target":"molding ･ modeling ･ moulding ･ shaping ･ modelling (i.e. plastic arts)"},{"info":"色濃い","target":"marked ･ pronounced ･ strongly tending to"},{"info":"英志","target":"[given] Hideshi ･ [given] Eishi ･ [unclass] Akiji ･ [given] Hideyuki ･ [given] Eiji ･ [unclass] Hideji"},{"info":"茨城","target":"[surname] Ibaragi ･ [place] Baraki ･ [place,surname] Ibaraki"}]},{"testType":"pron","eleType":"pronTwo","tierAlpha":"Two","allowedTypes":["pronTwo"],"qus":[{"info":"いってん","target":"complete change ･ turn"},{"info":"ようが","target":"(1) Western painting;  (2) Western film ･ Western movie"},{"info":"あて / かそ / かぞ / しし / ちち / ちゃん / てて / とと","target":"father"},{"info":"かげつ","target":"months (period of)"}]},{"testType":"def","eleType":"defTwo","tierAlpha":"Two","allowedTypes":["defTwo"],"qus":[{"info":"justified ･ deserved ･ as a matter of course ･ natural ･ reasonable","target":"当然 [とうぜん]"},{"info":"mother","target":"母 [あも / いろは / おも / かか / はは / はわ]"},{"info":"(1) drawing ･ pulling ･ towing ･ traction ･ hauling;  (2) driving (economic growth, etc.)","target":"けん引 / 牽引 [けんいん]"},{"info":"reopening ･ resumption ･ restarting","target":"再開 [さいかい]"}]}]},{"tests":[{"testType":"kanji","eleType":"kanjiThree","tierAlpha":"Three","allowedTypes":["kanjiThree"],"qus":[{"info":"足かけ","target":"(1) leg trip (in sumo, judo, etc.);  (2) foothold ･ pedal;  (3) nearly (used to estimate a period of time by rounding up incomplete units)"},{"info":"伊藤","target":"[surname] Toiu ･ [surname] Itouzaki ･ [unclass] Ito ･ [place,surname] Itou ･ [unclass] Itoo"},{"info":"程なく","target":"soon ･ before long ･ shortly thereafter"},{"info":"再々","target":"frequently ･ often"}]},{"testType":"pron","eleType":"pronThree","tierAlpha":"Three","allowedTypes":["pronThree"],"qus":[{"info":"ちゅうちょ","target":"hesitation ･ indecision ･ vacillation"},{"info":"べっきょ","target":"living apart ･ separation"},{"info":"かたほう","target":"(1) one party ･ one side ･ the other party ･ counterpart ･ the other side;  (2) mate ･ one of a pair ･ fellow"},{"info":"そうせつ","target":"organisation ･ establishment ･ founding ･ organization"}]},{"testType":"def","eleType":"defThree","tierAlpha":"Three","allowedTypes":["defThree"],"qus":[{"info":"(1) gradually (progress into a state);  (2) in turn ･ in order ･ in sequence","target":"次第に [しだいに]"},{"info":"draught ･ motion ･ draft ･ original bill ･ original plan","target":"原案 [げんあん]"},{"info":"unrelated","target":"無関係 [むかんけい]"},{"info":"scathing ･ bitter ･ severe","target":"痛烈 [つうれつ]"}]}]},{"tests":[{"testType":"kanji","eleType":"kanjiFour","tierAlpha":"Four","allowedTypes":["kanjiFour"],"qus":[{"info":"結社","target":"association ･ society"},{"info":"円盤","target":"(1) platter ･ discus ･ disk;  (2) flying saucer;  (3) disc media (CD, DVD, etc.)"},{"info":"濁点","target":"voiced consonant marks (nigori)"},{"info":"専門","target":"speciality ･ expert ･ specialty ･ subject of study ･ area of expertise"}]},{"testType":"pron","eleType":"pronFour","tierAlpha":"Four","allowedTypes":["pronFour"],"qus":[{"info":"どうきゅうせい","target":"classmates ･ classmate"},{"info":"ろくぶんぎ","target":"sextant"},{"info":"しじょう","target":"in a magazine"},{"info":"ちちゅう","target":"underground ･ subterranean"}]},{"testType":"def","eleType":"defFour","tierAlpha":"Four","allowedTypes":["defFour"],"qus":[{"info":"Russian (language)","target":"露語 [ろご]"},{"info":"to foster ･ to cultivate","target":"培う [つちかう]"},{"info":"(1) intermediation ･ commission ･ agency ･ distributor;  (2) reception (of guests);  (3) conveyance (of messages)","target":"取り次ぎ / 取次 / 取次ぎ [とりつぎ]"},{"info":"both things ･ both persons ･ pair ･ the two","target":"両者 [りょうしゃ]"}]}]}],"quizB":[{"tests":[{"testType":"kanji","eleType":"kanjiOne","tierAlpha":"One","allowedTypes":["kanjiOne"],"qus":[{"info":"総集編","target":"summary ･ compilation ･ highlights"},{"info":"に関して","target":"in relation to ･ related to"},{"info":"謝罪","target":"apology"},{"info":"拾","target":"[given] Osamu ･ [place] Jitsu"}]},{"testType":"pron","eleType":"pronOne","tierAlpha":"One","allowedTypes":["pronOne"],"qus":[{"info":"どうしゃ","target":"the same firm"},{"info":"しと","target":"disciple ･ apostle"},{"info":"あおい","target":"(1) blue ･ green;  (2) pale;  (3) inexperienced ･ unripe"},{"info":"し","target":"magazine"}]},{"testType":"def","eleType":"defOne","tierAlpha":"One","allowedTypes":["defOne"],"qus":[{"info":"(1) screening (a movie) ･ showing;  (2) to screen a movie","target":"上映 [じょうえい]"},{"info":"anchor","target":"碇 / 錨 [いかり]"},{"info":"invasion ･ attack ･ visitation (of a calamity) ･ raid","target":"襲来 [しゅうらい]"},{"info":"that year ･ same age ･ same year","target":"同年 [どうねん]"}]}]},{"tests":[{"testType":"kanji","eleType":"kanjiTwo","tierAlpha":"Two","allowedTypes":["kanjiTwo"],"qus":[{"info":"斬新","target":"newness ･ novel ･ original"},{"info":"破綻","target":"bankruptcy ･ failure"},{"info":"宮台","target":"[place] Miyanodai ･ [surname] Miyadai"},{"info":"戦死","target":"killed in action ･ KIA ･ death in action"}]},{"testType":"pron","eleType":"pronTwo","tierAlpha":"Two","allowedTypes":["pronTwo"],"qus":[{"info":"ほんぺん","target":"(1) original story ･ original version;  (2) this volume"},{"info":"さくふう","target":"literary style"},{"info":"げんそう","target":"illusions"},{"info":"どう","target":"(1) hall ･ temple ･ shrine;  (2) prefix to building meaning \"magnificent\""}]},{"testType":"def","eleType":"defTwo","tierAlpha":"Two","allowedTypes":["defTwo"],"qus":[{"info":"in order ･ sequential ･ seriatim","target":"順次 [じゅんじ]"},{"info":"(1) dismantling ･ demolishing ･ disassembly ･ deconstruction ･ dissolution;  (2) dissection (i.e. postmortem)","target":"解体 [かいたい]"},{"info":"incantation ･ faith-healing","target":"加持 [かじ]"},{"info":"same magazine","target":"同誌 [どうし]"}]}]},{"tests":[{"testType":"kanji","eleType":"kanjiThree","tierAlpha":"Three","allowedTypes":["kanjiThree"],"qus":[{"info":"構築","target":"architecture (systems, agreement, etc) ･ putting up ･ erecting ･ formulation ･ construction ･ building ･ creation"},{"info":"真希","target":"[fem] Nozomi ･ [given] Shinki ･ [fem,surname] Maki ･ [fem] Masaki ･ [fem] Miki"},{"info":"既刊","target":"already published"},{"info":"文化庁","target":"[place] Bunkachou ･ [place] Bunkamachi"}]},{"testType":"pron","eleType":"pronThree","tierAlpha":"Three","allowedTypes":["pronThree"],"qus":[{"info":"はんそく","target":"sales promotion"},{"info":"こうぞく","target":"succeeding ･ following ･ trailing"},{"info":"せんせん","target":"(war) front"},{"info":"じりつ","target":"(1) autonomy (philosophy);  (2) self-control"}]},{"testType":"def","eleType":"defThree","tierAlpha":"Three","allowedTypes":["defThree"],"qus":[{"info":"specification ･ clear writing","target":"明記 [めいき]"},{"info":"experimental use ･ trial","target":"試用 [しよう]"},{"info":"one's possessions ･ ownership","target":"所有 [しょゆう]"},{"info":"after that ･ next ･ then","target":"次に [つぎに]"}]}]},{"tests":[{"testType":"kanji","eleType":"kanjiFour","tierAlpha":"Four","allowedTypes":["kanjiFour"],"qus":[{"info":"一因","target":"cause"},{"info":"手応え","target":"feedback ･ reaction ･ resistance ･ response"},{"info":"同名","target":"same name"},{"info":"装甲","target":"armoured ･ armored"}]},{"testType":"pron","eleType":"pronFour","tierAlpha":"Four","allowedTypes":["pronFour"],"qus":[{"info":"しんき","target":"(1) fresh ･ new;  (2) new item (e.g. customer, regulation) ･ newly created object (orig. meaning);  (3) new customer"},{"info":"せんたい","target":"squadron"},{"info":"いえる","target":"to be possible to say ･ to be able to say"},{"info":"むに","target":"peerless ･ matchless"}]},{"testType":"def","eleType":"defFour","tierAlpha":"Four","allowedTypes":["defFour"],"qus":[{"info":"(1) to call oneself ･ to take the name of;  (2) to pretend ･ to purport ･ to feign","target":"称す [しょうす]"},{"info":"business world ･ business circles ･ (the) industry","target":"業界 [ぎょうかい]"},{"info":"instantaneous ･ right there on the spot ･ immediate ･ impromptu ･ instant","target":"即座 [そくざ]"},{"info":"mental ･ intrinsic ･ inner ･ inherited","target":"内的 [ないてき]"}]}]}],"quizC":[{"tests":[{"testType":"kanji","eleType":"kanjiOne","tierAlpha":"One","allowedTypes":["kanjiOne"],"qus":[{"info":"綾","target":"(1) figure ･ design;  (2) twill weave ･ pattern of diagonal stripes;  (3) style (of writing) ･ figure (of speech);  (4) plan ･ plot ･ design;  (5) minor market fluctuation ･ technical correction;  (6) cat's cradle;  (7) lease rod (in a loom)"},{"info":"貞","target":"[given] Misao ･ [given] Tadashi ･ [fem,surname] Sada ･ [unclass] Sadanori ･ [given] Takashi ･ [fem,surname] Tei ･ [given] Sadamu ･ [unclass] Sadatsugu ･ [unclass] Teiji ･ [fem] Misao ･ [given] Tadasu ･ [fem] Teiko ･ [unclass] Sadaji ･ [unclass] Sadazumi ･ [unclass] Sadayuki"},{"info":"完結","target":"conclusion ･ completion"},{"info":"視聴","target":"(1) (television) viewing ･ looking and listening;  (2) attention ･ interest"}]},{"testType":"pron","eleType":"pronOne","tierAlpha":"One","allowedTypes":["pronOne"],"qus":[{"info":"おなじく","target":"similarly ･ same (idea) ･ same (name)"},{"info":"けいれつ","target":"(1) sequence ･ system ･ order of succession ･ series;  (2) keiretsu (conglomeration of businesses linked by cross-shareholdings)"},{"info":"れんさい","target":"serialization ･ serialisation ･ serial story"},{"info":"じてん","target":"occasion ･ point in time"}]},{"testType":"def","eleType":"defOne","tierAlpha":"One","allowedTypes":["defOne"],"qus":[{"info":"(1) inscribing on the face ･ writing on the surface (e.g. an address on an envelope);  (2) transcription ･ surface form ･ notation ･ expression in writing","target":"表記 [ひょうき]"},{"info":"SFX ･ special effects","target":"特撮 [とくさつ]"},{"info":"(1) maneuver (usu. of military force) ･ manoeuvre;  (2) mobile ･ agile ･ quick to respond ･ nimble","target":"機動 [きどう]"},{"info":"towards ･ against ･ in contrast with ･ regarding","target":"に対し [にたいし]"}]}]},{"tests":[{"testType":"kanji","eleType":"kanjiTwo","tierAlpha":"Two","allowedTypes":["kanjiTwo"],"qus":[{"info":"大月","target":"[place,surname] Oodzuki ･ [place,surname] Ootsuki ･ [given] Taigetsu"},{"info":"多数","target":"(1) great number;  (2) countless ･ majority"},{"info":"僕ら","target":"we"},{"info":"売り上げ","target":"takings ･ proceeds ･ turnover ･ sales ･ amount sold"}]},{"testType":"pron","eleType":"pronTwo","tierAlpha":"Two","allowedTypes":["pronTwo"],"qus":[{"info":"はつどう","target":"(1) putting into operation;  (2) invocation"},{"info":"ひょうめい","target":"manifestation ･ expression ･ assertion ･ demonstration ･ indication ･ declaration ･ representation ･ announcement"},{"info":"たんこう","target":"going alone ･ doing by oneself"},{"info":"はいじん","target":"disabled person ･ invalid ･ cripple"}]},{"testType":"def","eleType":"defTwo","tierAlpha":"Two","allowedTypes":["defTwo"],"qus":[{"info":"getting over ･ overcoming ･ surmounting ･ conquering","target":"超克 [ちょうこく]"},{"info":"special book ･ separate volume ･ book of lectures","target":"単行本 [たんこうぼん]"},{"info":"voice actor or actress (radio, animation, etc.)","target":"声優 [せいゆう]"},{"info":"stopping publication (of serialized content in newspapers, magazines, etc.) ･ nonappearance in print","target":"休載 [きゅうさい]"}]}]},{"tests":[{"testType":"kanji","eleType":"kanjiThree","tierAlpha":"Three","allowedTypes":["kanjiThree"],"qus":[{"info":"司令","target":"command ･ control ･ commander"},{"info":"月野","target":"[fem] Tsukino ･ [place,surname,fem] Tsukino"},{"info":"切断","target":"cutting ･ disconnection ･ amputation ･ severance ･ section"},{"info":"主流","target":"(1) mainstream ･ commonplace;  (2) main stream ･ main course (of a river)"}]},{"testType":"pron","eleType":"pronThree","tierAlpha":"Three","allowedTypes":["pronThree"],"qus":[{"info":"いっかん","target":"(1) coherence ･ integration ･ consistency;  (2) one kan (approx. 3.75 kg, 8.3 lb);  (3) one piece of sushi"},{"info":"せん","target":"election ･ choice ･ choosing ･ selection ･ picking"},{"info":"せつ","target":"acute ･ keen ･ ardent ･ earnest ･ eager ･ kind"},{"info":"そう","target":"(1) bed ･ seam ･ class ･ stream ･ layer;  (2) sheaf;  (3) floor ･ storey (of a building) ･ story"}]},{"testType":"def","eleType":"defThree","tierAlpha":"Three","allowedTypes":["defThree"],"qus":[{"info":"external ･ outside","target":"外的 [がいてき]"},{"info":"personally ･ just before one's eyes ･ in one's presence","target":"まの当り / 目のあたり / 目の当たり / 目の当り / 目の辺り / 眼の当たり / 眼の当り [まのあたり]"},{"info":"everybody ･ people ･ each person ･ men and women","target":"人々 / 人びと / 人人 [にんにん / ひとびと]"},{"info":"total up to now ･ accumulated total ･ cumulative total","target":"累計 [るいけい]"}]}]},{"tests":[{"testType":"kanji","eleType":"kanjiFour","tierAlpha":"Four","allowedTypes":["kanjiFour"],"qus":[{"info":"下ろす","target":"(1) to take down (e.g. flag) ･ to unload ･ to let (a person) off ･ to drop ･ to launch (e.g. boat) ･ to discharge ･ to lower (e.g. ladder);  (2) to let (a person) off ･ to drop off (a passenger from a vehicle);  (3) to withdraw money from an account;  (4) to wear (clothing) for the first time;  (5) to fillet (e.g. a fish)"},{"info":"持ち込む","target":"(1) to carry in ･ to bring in ･ to take something into ...;  (2) to commence negotiations ･ to bring (a proposal) ･ to lodge (a complaint) ･ to file (a plan);  (3) to bring to (a state: tied game, vote, trial, etc.)"},{"info":"所信","target":"belief ･ conviction ･ opinion"},{"info":"ひ孫","target":"great-grandchild"}]},{"testType":"pron","eleType":"pronFour","tierAlpha":"Four","allowedTypes":["pronFour"],"qus":[{"info":"ほうが","target":"(1) Japanese film;  (2) Japanese painting"},{"info":"よみきり","target":"(1) finishing reading;  (2) complete novel ･ non-serialised stories (e.g. in magazines);  (3) punctuation"},{"info":"ずいしょ","target":"everywhere ･ at every turn"},{"info":"ていねん","target":"a heart that understands truth ･ understanding and acceptance ･ (feeling of) resignation ･ spiritual awakening"}]},{"testType":"def","eleType":"defFour","tierAlpha":"Four","allowedTypes":["defFour"],"qus":[{"info":"to reach the limits ･ to come to the end of one's tether","target":"行き詰まる / 行き詰る / 行詰まる / 行詰る [いきづまる / ゆきづまる]"},{"info":"(1) technique of grasping the arm of the opponent, the moment he comes forward, while stepping out of line and pushing down on the shoulder blade with the other hand, thus pulling him down ･ under-shoulder swing-down;  (2) dodging ･ parrying (questions);  (3) letdown ･ disappointment","target":"肩すかし / 肩透かし [かたすかし]"},{"info":"patriotism ･ love of (one's) country","target":"愛国 [あいこく]"},{"info":"nickname ･ alias ･ popular name","target":"通称 [つうしょう]"}]}]}]}];
                        
                        sc.x = jsonParsedresponse.list;
                        sc.articles = ["article1", "article2", "article3"];
                        if(sc.stage === 'quizAPending') sc.rw = jsonParsedresponse.quizA;
                        else if(sc.stage === 'quizBPending') sc.rw = jsonParsedresponse.quizB;
                        else if(sc.stage === 'finished') sc.finishedAlready = true;
                        else alert("Error: uid.status file didn't contain a recognised 'stage' of quiz progression.");
                        // console.log(sc.rw);
                        sc.dummy = jsonParsedresponse.quizC;
                        sc.r = JSON.parse(JSON.stringify(sc.rw));
                        // r[0] is tierOne.
                        for(var i = 0; i < sc.rw.length; i++) sc.insertAnswers(sc.r[i]);
                        for(var i = 0; i < sc.rw.length; i++) sc.insertDummy(sc.rw[i], sc.dummy[i]);
                        for(var i = 0; i < sc.rw.length; i++) sc.shuffleAllTestsInTier(sc.rw[i]);

                        // console.log(sc.r);
                    }
                    
                    // from http://stackoverflow.com/questions/20789373/shuffle-array-in-ng-repeat-angular
                    sc.shuffleArray = function(array) {
                      var m = array.length, t, i;

                      // While there remain elements to shuffle
                      while (m) {
                        // Pick a remaining element…
                        i = Math.floor(Math.random() * m--);

                        // And swap it with the current element.
                        t = array[m];
                        array[m] = array[i];
                        array[i] = t;
                      }

                      return array;
                    }

                    sc.shuffleAllTestsInTier = function(tier){
                        for(var i=0; i < tier.tests.length; i++){
                            tier.tests[i].qus = sc.shuffleArray(tier.tests[i].qus);
                        }
                    }

                    sc.insertAnswers = function(tier){
                        for(var i=0; i < tier.tests.length; i++){
                            tier.tests[i].answers = [];
                            sc.insertBuckets(tier.tests[i]);
                        }
                    }

                    // pushes as many buckets into a test's 'answers' array as are needed
                    sc.insertBuckets = function(test){
                        for(var i=0; i<test.qus.length; i++){
                            test.answers.push( 
                                {
                                    "bucket": [] 
                                }
                            );
                        }
                    }

                    sc.insertDummy = function(tierRw, tierDummy){
                        for(var i=0; i < tierRw.tests.length; i++){
                            // Adding only two dummy questions per section (or less, if dummy is underpopulated)
                            for(var j=0; j < Math.min(tierDummy.tests[i].qus.length, 2); j++){
                                tierRw.tests[i].qus.push(tierDummy.tests[i].qus[j]);
                            }
                        }
                    }

                    /** Two modes: Append to the user's report, or make main JSON. */
                    sc.postmanQ = function(uid, extension, input, separator){
                        $.ajax({
                                url        : "http://127.0.0.1:3000/generator", // using the generator address is actually correct presently.
                                // dataType   : 'json', // this is the expected payload type. Doesn't like response.status(200).end()
                                contentType: 'application/json; charset=UTF-8',
                                data       : JSON.stringify({
                                    "uid": uid,
                                    "input": input,
                                    "separator": separator,
                                    "extension": extension
                                }),
                                type       : 'POST'
                            })
                            // HTTP 200 may send you in here
                            .done(function(data, textStatus, jqXHR) {
                                // console.log(data); // logs the incoming data as javascript objects
                                sc.$apply(function() {
                                    sc.reportSent = true;
                                    sc.postmanError = false;
                                });
                            })
                            // HTTP 500 may send you in here
                            .fail(function(jqXHR, textStatus, errorThrown) {
                                console.error(arguments);
                                sc.$apply(function() {
                                    sc.reportSent = false;
                                    sc.postmanError = true;
                                    // sc.finishedSearch = false;
                                    // sc.startedSearch = false;
                                });
                            })
                        ;
                    }

                    sc.quizResultsObj = function(quiz) {
                        var rpQuiz = {};
                        var kTotalMin = 0;
                        var kTotalMax = 0;
                        var pTotalMin = 0;
                        var pTotalMax = 0;
                        var dTotalMin = 0;
                        var dTotalMax = 0;
                        var tierMins = [];
                        var tierMaxes = [];

                        rpQuiz.tiers = [];

                        for(var i = 0; i < quiz.length; i++){ // tiers
                            rpQuiz.tiers.push({});

                            tierMins[i] = 0;
                            tierMaxes[i] = 0;

                            for(var j = 0; j < quiz[i].tests.length; j++){ // tests
                                var min = sc.calculateTestScore(quiz[i].tests[j].qus, quiz[i].tests[j].answers);
                                var max = quiz[i].tests[j].qus.length;
                                var minMax = {
                                    "min": min,
                                    "max": max
                                };

                                switch(j){
                                    case 0:
                                        rpQuiz.tiers[i].kanji = minMax;
                                        kTotalMin += min;
                                        kTotalMax += max;
                                        break;
                                    case 1:
                                        rpQuiz.tiers[i].pron = minMax;
                                        pTotalMin += min;
                                        pTotalMax += max;
                                        break;
                                    case 2:
                                        rpQuiz.tiers[i].def = minMax;
                                        dTotalMin += min;
                                        dTotalMax += max;
                                        break;
                                }

                                tierMins[i] += min;
                                tierMaxes[i] += max;
                            }
                            rpQuiz.tiers[i].tiermin = tierMins[i];
                            rpQuiz.tiers[i].tiermax = tierMaxes[i];
                        }
                        rpQuiz.totals = {};
                        rpQuiz.totals.overall = { "min": kTotalMin + pTotalMin + dTotalMin, "max": kTotalMax + pTotalMax + dTotalMax };
                        rpQuiz.totals.kanji = { "min": kTotalMin, "max": kTotalMax };
                        rpQuiz.totals.pron = { "min": pTotalMin, "max": pTotalMax };
                        rpQuiz.totals.def = { "min": dTotalMin, "max": dTotalMax };

                        return rpQuiz;
                    }

                    /** Generates the main JSON and report via postmanQ(). Currently being triggered inside read(). */
                    sc.reportScores = function() {
                        var report = sc.quizResultsObj(sc.r);

                        // var report = {
                        //                 "tierOneK": sc.calculateTestScore(sc.r[0].tests[0].qus, sc.r[0].tests[0].answers) + ' / ' + sc.r[0].tests[0].qus.length,
                        //                 "tierOneP": sc.calculateTestScore(sc.r[0].tests[1].qus, sc.r[0].tests[1].answers) + ' / ' + sc.r[0].tests[1].qus.length,
                        //                 "tierOneD": sc.calculateTestScore(sc.r[0].tests[2].qus, sc.r[0].tests[2].answers) + ' / ' + sc.r[0].tests[2].qus.length
                        //             };
                        // TODO: will also need to take a survey of thoughts.

                        console.log(report);
                        var st;
                        var stage;
                        if(sc.stage === 'quizAPending'){
                            stage = { "stage": 'quizBPending' };
                            st = 'A';
                            sc.postmanQ(sc.uid, '.status', stage, '');
                        }
                        if(sc.stage === 'quizBPending'){
                            stage = { "stage": 'finished' };
                            st = 'B';  
                            sc.postmanQ(sc.uid, '.status', stage, '');
                        }

                        sc.postmanQ(sc.uid, '.txt', report, '/*=== Quiz' + st + ' results ===*/\n'); // The report
                    };

                    sc.twoReads = function(uid){
                        if(uid != null) sc.read(uid, '.status');
                        if(uid != null) sc.read(uid, '.json');
                    };

                    // THESE START ON PAGE LOAD:
                    sc.uid = $stateParams['uid'];
                    sc.twoReads(sc.uid);
                    // if(sc.uid != null) sc.read(sc.uid, '.status');
                    // if(sc.uid != null) sc.read(sc.uid, '.json');

                    // Can't trigger this on page load because sc.read() of JSON occurs asynchronously and thus hasn't completed by the time this line is reached.
                    // sc.reportScores();

                }]
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
                    console.log(element);
                    element.click();
                    element.slideUp(done);
                }
            },
            removeClass: function(element, className, done) {
                if(className === NG_HIDE_CLASS) {
                    console.log(element);
                    element.click();
                    element.hide().slideDown(done);
                }
            }
        }
    })
    ;
